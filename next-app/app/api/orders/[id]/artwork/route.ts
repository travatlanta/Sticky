export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    const orderResult = await db.execute(sql`
      SELECT id, order_number, status, user_id
      FROM orders WHERE id = ${orderId} LIMIT 1
    `);

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0] as any;

    if (order.user_id !== userId && !(session.user as any).isAdmin) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const itemsResult = await db.execute(sql`
      SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price, oi.design_id,
             p.name as product_name, p.thumbnail_url,
             d.id as design_id, d.name as design_name, d.preview_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN designs d ON oi.design_id = d.id
      WHERE oi.order_id = ${orderId}
    `);

    const items = (itemsResult.rows || []).map((row: any) => {
      const isApproved = row.design_name && row.design_name.includes('[APPROVED]');
      const isPending = row.design_name && row.design_name.includes('[PENDING]');
      return {
        id: row.id,
        productId: row.product_id,
        quantity: row.quantity,
        unitPrice: row.unit_price,
        product: {
          name: row.product_name,
          thumbnailUrl: row.thumbnail_url,
        },
        design: row.design_id ? {
          id: row.design_id,
          name: row.design_name,
          previewUrl: row.preview_url,
          artworkUrl: row.preview_url,
          status: isApproved ? 'approved' : (isPending ? 'pending' : 'uploaded'),
        } : null,
      };
    });

    return NextResponse.json({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      items,
    });
  } catch (error) {
    console.error("Error fetching order artwork:", error);
    return NextResponse.json({ message: "Failed to fetch order" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    const userId = (session.user as any).id;

    const orderResult = await db.execute(sql`
      SELECT id, order_number, status, user_id
      FROM orders 
      WHERE id = ${orderId}
      LIMIT 1
    `);

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0] as any;

    if (order.user_id !== userId && !(session.user as any).isAdmin) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const orderItemId = formData.get("orderItemId") as string | null;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    if (!orderItemId) {
      return NextResponse.json({ message: "Order item ID required" }, { status: 400 });
    }

    const itemResult = await db.execute(sql`
      SELECT id, design_id, product_id FROM order_items 
      WHERE id = ${parseInt(orderItemId)} AND order_id = ${order.id}
    `);

    if (!itemResult.rows || itemResult.rows.length === 0) {
      return NextResponse.json({ message: "Order item not found" }, { status: 404 });
    }

    const orderItem = itemResult.rows[0] as any;

    const filename = `order-${order.order_number}-item-${orderItemId}-${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: "public",
    });

    let designId = orderItem.design_id;

    if (designId) {
      await db.execute(sql`
        UPDATE designs SET
          preview_url = ${blob.url},
          name = ${'[PENDING] Artwork for Order ' + order.order_number},
          updated_at = NOW()
        WHERE id = ${designId}
      `);
    } else {
      const designResult = await db.execute(sql`
        INSERT INTO designs (name, preview_url, product_id, created_at, updated_at)
        VALUES (
          ${'[PENDING] Artwork for Order ' + order.order_number},
          ${blob.url},
          ${orderItem.product_id},
          NOW(),
          NOW()
        )
        RETURNING id
      `);
      
      designId = (designResult.rows[0] as any).id;

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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    const userId = (session.user as any).id;
    const body = await request.json();
    const { orderItemId, action } = body;

    if (!orderItemId) {
      return NextResponse.json({ message: "Order item ID required" }, { status: 400 });
    }

    const orderResult = await db.execute(sql`
      SELECT id, order_number, status, user_id
      FROM orders 
      WHERE id = ${orderId}
      LIMIT 1
    `);

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0] as any;

    if (order.user_id !== userId && !(session.user as any).isAdmin) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    const itemResult = await db.execute(sql`
      SELECT id, design_id FROM order_items 
      WHERE id = ${parseInt(orderItemId)} AND order_id = ${order.id}
    `);

    if (!itemResult.rows || itemResult.rows.length === 0) {
      return NextResponse.json({ message: "Order item not found" }, { status: 404 });
    }

    const orderItem = itemResult.rows[0] as any;

    if (!orderItem.design_id) {
      return NextResponse.json({ message: "No artwork to approve" }, { status: 400 });
    }

    if (action === "approve") {
      await db.execute(sql`
        UPDATE designs SET
          name = '[APPROVED] ' || REGEXP_REPLACE(name, '^\[(PENDING|APPROVED)\]\s*', ''),
          updated_at = NOW()
        WHERE id = ${orderItem.design_id}
      `);

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

      return NextResponse.json({
        success: true,
        approved: true,
        allItemsApproved: allApproved,
        message: "Artwork approved successfully",
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const orderItemId = searchParams.get("orderItemId");

    if (!orderItemId) {
      return NextResponse.json({ message: "Order item ID required" }, { status: 400 });
    }

    const orderResult = await db.execute(sql`
      SELECT id, user_id FROM orders 
      WHERE id = ${orderId}
      LIMIT 1
    `);

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0] as any;

    if (order.user_id !== userId && !(session.user as any).isAdmin) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    const itemResult = await db.execute(sql`
      SELECT id, design_id FROM order_items 
      WHERE id = ${parseInt(orderItemId)} AND order_id = ${order.id}
    `);

    if (!itemResult.rows || itemResult.rows.length === 0) {
      return NextResponse.json({ message: "Order item not found" }, { status: 404 });
    }

    const orderItem = itemResult.rows[0] as any;

    if (orderItem.design_id) {
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
