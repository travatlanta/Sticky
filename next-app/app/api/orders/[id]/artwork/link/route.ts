export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const body = await request.json();
    const { orderItemId, designId } = body;

    if (!orderItemId || !designId) {
      return NextResponse.json(
        { message: "orderItemId and designId are required" },
        { status: 400 }
      );
    }

    const orderResult = await db.execute(sql`
      SELECT id, order_number, user_id
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
      SELECT id FROM order_items 
      WHERE id = ${parseInt(orderItemId)} AND order_id = ${order.id}
    `);

    if (!itemResult.rows || itemResult.rows.length === 0) {
      return NextResponse.json({ message: "Order item not found" }, { status: 404 });
    }

    const designResult = await db.execute(sql`
      SELECT id FROM designs WHERE id = ${parseInt(designId)}
    `);

    if (!designResult.rows || designResult.rows.length === 0) {
      return NextResponse.json({ message: "Design not found" }, { status: 404 });
    }

    await db.execute(sql`
      UPDATE order_items 
      SET design_id = ${parseInt(designId)}
      WHERE id = ${parseInt(orderItemId)}
    `);

    await db.execute(sql`
      UPDATE designs 
      SET name = '[CUSTOMER_UPLOAD] ' || COALESCE(name, 'Design'),
          updated_at = NOW()
      WHERE id = ${parseInt(designId)}
      AND name NOT LIKE '%[CUSTOMER_UPLOAD]%'
      AND name NOT LIKE '%[ADMIN_DESIGN]%'
      AND name NOT LIKE '%[APPROVED]%'
    `);

    return NextResponse.json({
      success: true,
      message: "Design linked to order item",
    });
  } catch (error) {
    console.error("Error linking design:", error);
    return NextResponse.json({ message: "Failed to link design" }, { status: 500 });
  }
}
