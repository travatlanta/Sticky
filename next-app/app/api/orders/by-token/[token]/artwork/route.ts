export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { put } from "@vercel/blob";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 32) {
      return NextResponse.json({ message: "Invalid token" }, { status: 400 });
    }

    // Find order by token
    const orderResult = await db.execute(sql`
      SELECT id, order_number, status
      FROM orders 
      WHERE notes LIKE ${'%Payment Link: ' + token + '%'}
      LIMIT 1
    `);

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0] as any;
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const orderItemId = formData.get("orderItemId") as string | null;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    if (!orderItemId) {
      return NextResponse.json({ message: "Order item ID required" }, { status: 400 });
    }

    // Verify the order item belongs to this order
    const itemResult = await db.execute(sql`
      SELECT id, design_id, product_id FROM order_items 
      WHERE id = ${parseInt(orderItemId)} AND order_id = ${order.id}
    `);

    if (!itemResult.rows || itemResult.rows.length === 0) {
      return NextResponse.json({ message: "Order item not found" }, { status: 404 });
    }

    const orderItem = itemResult.rows[0] as any;

    // Upload file to Vercel Blob
    const filename = `order-${order.order_number}-item-${orderItemId}-${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: "public",
    });

    // Create or update design
    let designId = orderItem.design_id;

    if (designId) {
      // Update existing design - reset to pending when new artwork uploaded
      // NOTE: Production lacks artwork_url column, only use preview_url
      await db.execute(sql`
        UPDATE designs SET
          preview_url = ${blob.url},
          name = ${'[CUSTOMER_UPLOAD] Artwork for Order ' + order.order_number},
          updated_at = NOW()
        WHERE id = ${designId}
      `);
    } else {
      // Create new design with pending status
      // NOTE: Production lacks artwork_url column, only use preview_url
      const designResult = await db.execute(sql`
        INSERT INTO designs (name, preview_url, product_id, created_at, updated_at)
        VALUES (
          ${'[CUSTOMER_UPLOAD] Artwork for Order ' + order.order_number},
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
        WHERE id = ${parseInt(orderItemId)}
      `);
    }

    return NextResponse.json({
      success: true,
      designId,
      artworkUrl: blob.url,
      message: "Artwork uploaded successfully",
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error("Error uploading artwork:", error);
    return NextResponse.json({ message: "Failed to upload artwork" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { orderItemId, action, designId } = body;

    if (!token || token.length < 32) {
      return NextResponse.json({ message: "Invalid token" }, { status: 400 });
    }

    if (!orderItemId) {
      return NextResponse.json({ message: "Order item ID required" }, { status: 400 });
    }

    // Find order by token
    const orderResult = await db.execute(sql`
      SELECT id, order_number, status
      FROM orders 
      WHERE notes LIKE ${'%Payment Link: ' + token + '%'}
      LIMIT 1
    `);

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0] as any;

    // Verify the order item belongs to this order
    const itemResult = await db.execute(sql`
      SELECT id, design_id FROM order_items 
      WHERE id = ${parseInt(orderItemId)} AND order_id = ${order.id}
    `);

    if (!itemResult.rows || itemResult.rows.length === 0) {
      return NextResponse.json({ message: "Order item not found" }, { status: 404 });
    }

    const orderItem = itemResult.rows[0] as any;

    // Handle linking a design from the editor
    if (designId) {
      await db.execute(sql`
        UPDATE order_items SET design_id = ${designId}
        WHERE id = ${parseInt(orderItemId)}
      `);
      
      return NextResponse.json({
        success: true,
        designId,
        message: "Design linked to order successfully",
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    }

    if (!orderItem.design_id) {
      return NextResponse.json({ message: "No artwork to approve" }, { status: 400 });
    }

    if (action === "approve") {
      // Mark design as approved - set name deterministically with [APPROVED] prefix
      // Remove any existing status tags first (PENDING, APPROVED, FLAGGED, ADMIN_DESIGN, CUSTOMER_UPLOAD), then add [APPROVED]
      await db.execute(sql`
        UPDATE designs SET
          name = '[APPROVED] ' || REGEXP_REPLACE(name, '^\[(PENDING|APPROVED|FLAGGED|ADMIN_DESIGN|CUSTOMER_UPLOAD)\]\s*', ''),
          updated_at = NOW()
        WHERE id = ${orderItem.design_id}
      `);

      // Check if all items in order have approved designs
      const allItemsResult = await db.execute(sql`
        SELECT oi.id, oi.design_id, d.name as design_name
        FROM order_items oi
        LEFT JOIN designs d ON oi.design_id = d.id
        WHERE oi.order_id = ${order.id}
      `);

      const allItems = allItemsResult.rows || [];
      const allApproved = allItems.every((item: any) => 
        item.design_id && item.design_name && item.design_name.includes('[APPROVED]')
      );

      // If all items have approved artwork, update order artwork_status to 'approved'
      if (allApproved) {
        await db.execute(sql`
          UPDATE orders SET artwork_status = 'approved', updated_at = NOW()
          WHERE id = ${order.id}
        `);
      }

      return NextResponse.json({
        success: true,
        approved: true,
        allItemsApproved: allApproved,
        message: "Artwork approved successfully",
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating artwork:", error);
    return NextResponse.json({ message: "Failed to update artwork" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const orderItemId = searchParams.get("orderItemId");

    if (!token || token.length < 32) {
      return NextResponse.json({ message: "Invalid token" }, { status: 400 });
    }

    if (!orderItemId) {
      return NextResponse.json({ message: "Order item ID required" }, { status: 400 });
    }

    // Find order by token
    const orderResult = await db.execute(sql`
      SELECT id FROM orders 
      WHERE notes LIKE ${'%Payment Link: ' + token + '%'}
      LIMIT 1
    `);

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0] as any;

    // Verify the order item belongs to this order
    const itemResult = await db.execute(sql`
      SELECT id, design_id FROM order_items 
      WHERE id = ${parseInt(orderItemId)} AND order_id = ${order.id}
    `);

    if (!itemResult.rows || itemResult.rows.length === 0) {
      return NextResponse.json({ message: "Order item not found" }, { status: 404 });
    }

    const orderItem = itemResult.rows[0] as any;

    if (orderItem.design_id) {
      // Clear design link from order item
      await db.execute(sql`
        UPDATE order_items SET design_id = NULL
        WHERE id = ${parseInt(orderItemId)}
      `);
    }

    return NextResponse.json({
      success: true,
      message: "Artwork removed",
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error("Error removing artwork:", error);
    return NextResponse.json({ message: "Failed to remove artwork" }, { status: 500 });
  }
}
