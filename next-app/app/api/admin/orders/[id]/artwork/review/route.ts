export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
    }

    // Get order details
    const orderResult = await db.execute(sql`
      SELECT id, order_number, user_id, notes
      FROM orders WHERE id = ${orderId}
    `);

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0] as any;
    
    // Parse customer email from notes
    let customerEmail: string | null = null;
    if (order.notes) {
      const emailMatch = order.notes.match(/(?:Email|Customer Email):\s*(.+?)(?:\n|$)/i);
      if (emailMatch) customerEmail = emailMatch[1].trim();
    }

    // Check content type to determine if it's form data or JSON
    const contentType = request.headers.get('content-type') || '';
    
    let orderItemId: number;
    let action: string;
    let notes: string = '';
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      orderItemId = parseInt(formData.get("orderItemId") as string);
      action = formData.get("action") as string;
      notes = formData.get("notes") as string || '';
      file = formData.get("file") as File | null;
    } else {
      // Handle JSON
      const body = await request.json();
      orderItemId = body.orderItemId;
      action = body.action;
      notes = body.notes || '';
    }

    if (!orderItemId || isNaN(orderItemId)) {
      return NextResponse.json({ message: "Order item ID required" }, { status: 400 });
    }

    // Verify order item belongs to this order
    const itemResult = await db.execute(sql`
      SELECT id, design_id, product_id FROM order_items
      WHERE id = ${orderItemId} AND order_id = ${orderId}
    `);

    if (!itemResult.rows || itemResult.rows.length === 0) {
      return NextResponse.json({ message: "Order item not found" }, { status: 404 });
    }

    const orderItem = itemResult.rows[0] as any;

    if (action === 'flag') {
      // Flag artwork for revision
      if (!orderItem.design_id) {
        return NextResponse.json({ message: "No design to flag" }, { status: 400 });
      }

      // Update design name to include [FLAGGED] tag
      await db.execute(sql`
        UPDATE designs SET
          name = '[FLAGGED] ' || REGEXP_REPLACE(name, '^\[(ADMIN_DESIGN|CUSTOMER_UPLOAD|FLAGGED|APPROVED|PENDING)\]\s*', ''),
          updated_at = NOW()
        WHERE id = ${orderItem.design_id}
      `);

      // Add a message to the order communication
      await db.execute(sql`
        INSERT INTO artwork_notes (order_id, order_item_id, user_id, sender_type, content, created_at)
        VALUES (
          ${orderId},
          ${orderItemId},
          ${session.user.id},
          'admin',
          ${'Artwork Revision Requested: ' + (notes || 'Please update your design.')},
          NOW()
        )
      `).catch(() => {
        // artwork_notes table might not exist, that's okay
        console.log('artwork_notes table not available');
      });

      // TODO: Send email notification to customer
      // For now, the customer will see the flagged status on their payment page

      return NextResponse.json({
        success: true,
        message: "Artwork flagged for revision",
        designId: orderItem.design_id,
      });

    } else if (action === 'admin_upload') {
      // Admin uploads new design for customer approval
      if (!file) {
        return NextResponse.json({ message: "File required for upload" }, { status: 400 });
      }

      // Upload file to Vercel Blob
      const filename = `admin-design-order-${order.order_number}-item-${orderItemId}-${Date.now()}-${file.name}`;
      const blob = await put(filename, file, {
        access: "public",
      });

      let designId = orderItem.design_id;

      if (designId) {
        // Update existing design
        await db.execute(sql`
          UPDATE designs SET
            preview_url = ${blob.url},
            high_res_export_url = ${blob.url},
            name = ${'[ADMIN_DESIGN] ' + (notes ? notes.substring(0, 50) : 'Admin Design for Order ' + order.order_number)},
            updated_at = NOW()
          WHERE id = ${designId}
        `);
      } else {
        // Create new design
        const designResult = await db.execute(sql`
          INSERT INTO designs (name, preview_url, high_res_export_url, product_id, created_at, updated_at)
          VALUES (
            ${'[ADMIN_DESIGN] ' + (notes ? notes.substring(0, 50) : 'Admin Design for Order ' + order.order_number)},
            ${blob.url},
            ${blob.url},
            ${orderItem.product_id},
            NOW(),
            NOW()
          )
          RETURNING id
        `);
        
        designId = (designResult.rows[0] as any).id;

        // Link design to order item
        await db.execute(sql`
          UPDATE order_items SET design_id = ${designId}
          WHERE id = ${orderItemId}
        `);
      }

      // Add a message to the order communication
      await db.execute(sql`
        INSERT INTO artwork_notes (order_id, order_item_id, user_id, sender_type, content, created_at)
        VALUES (
          ${orderId},
          ${orderItemId},
          ${session.user.id},
          'admin',
          ${'New Design Uploaded: ' + (notes || 'Please review and approve this design.')},
          NOW()
        )
      `).catch(() => {
        console.log('artwork_notes table not available');
      });

      // TODO: Send email notification to customer

      return NextResponse.json({
        success: true,
        message: "Design uploaded for customer approval",
        designId,
        artworkUrl: blob.url,
      });
    } else if (action === 'approve') {
      // Admin approves customer artwork - order is ready for printing
      if (!orderItem.design_id) {
        return NextResponse.json({ message: "No design to approve" }, { status: 400 });
      }

      // Update design name to include [APPROVED] tag
      await db.execute(sql`
        UPDATE designs SET
          name = '[APPROVED] ' || REGEXP_REPLACE(name, '^\[(ADMIN_DESIGN|CUSTOMER_UPLOAD|FLAGGED|APPROVED|PENDING)\]\s*', ''),
          status = 'approved',
          updated_at = NOW()
        WHERE id = ${orderItem.design_id}
      `);

      // Update order artwork_status to 'approved'
      try {
        await db.execute(sql`
          UPDATE orders SET artwork_status = 'approved'
          WHERE id = ${orderId}
        `);
      } catch (err) {
        console.log('Could not update artwork_status column (may not exist)');
      }

      // Add a message to the order communication
      await db.execute(sql`
        INSERT INTO artwork_notes (order_id, order_item_id, user_id, sender_type, content, created_at)
        VALUES (
          ${orderId},
          ${orderItemId},
          ${session.user.id},
          'admin',
          ${'Artwork Approved: ' + (notes || 'Your design has been approved and is ready for printing!')},
          NOW()
        )
      `).catch(() => {
        console.log('artwork_notes table not available');
      });

      return NextResponse.json({
        success: true,
        message: "Artwork approved",
        designId: orderItem.design_id,
      });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error processing artwork review:", error);
    return NextResponse.json({ message: "Failed to process artwork review" }, { status: 500 });
  }
}
