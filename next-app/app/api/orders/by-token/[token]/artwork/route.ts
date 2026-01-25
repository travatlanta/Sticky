export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { put } from "@vercel/blob";

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

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
      // Update existing design
      await db.execute(sql`
        UPDATE designs SET
          artwork_url = ${blob.url},
          preview_url = ${blob.url},
          updated_at = NOW()
        WHERE id = ${designId}
      `);
    } else {
      // Create new design
      const designResult = await db.execute(sql`
        INSERT INTO designs (name, artwork_url, preview_url, product_id, created_at, updated_at)
        VALUES (
          ${'Artwork for Order ' + order.order_number},
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
        WHERE id = ${parseInt(orderItemId)}
      `);
    }

    return NextResponse.json({
      success: true,
      designId,
      artworkUrl: blob.url,
      message: "Artwork uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading artwork:", error);
    return NextResponse.json({ message: "Failed to upload artwork" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
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
    });
  } catch (error) {
    console.error("Error removing artwork:", error);
    return NextResponse.json({ message: "Failed to remove artwork" }, { status: 500 });
  }
}
