export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const body = await request.json();
    const { productId, quantity, unitPrice, selectedOptions } = body;

    if (!productId || !quantity || unitPrice === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: productId, quantity, unitPrice" },
        { status: 400 }
      );
    }

    // Verify order exists using raw SQL with explicit columns
    const orderResult = await db.execute(sql`
      SELECT id, subtotal, shipping_cost 
      FROM orders 
      WHERE id = ${orderId} 
      LIMIT 1
    `);
    
    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const order = orderResult.rows[0] as { id: number; subtotal: string; shipping_cost: string };

    // Verify product exists using raw SQL
    const productResult = await db.execute(sql`
      SELECT id, name, base_price 
      FROM products 
      WHERE id = ${parseInt(productId)} 
      LIMIT 1
    `);
    
    if (!productResult.rows || productResult.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create the order item using raw SQL with explicit columns
    const insertResult = await db.execute(sql`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, selected_options)
      VALUES (${orderId}, ${parseInt(productId)}, ${parseInt(quantity)}, ${unitPrice.toString()}, ${JSON.stringify(selectedOptions || {})})
      RETURNING id, order_id, product_id, quantity, unit_price, selected_options
    `);

    const newItem = insertResult.rows[0];

    // Update order totals using raw SQL
    const itemTotal = parseFloat(unitPrice) * parseInt(quantity);
    const newSubtotal = parseFloat(order.subtotal || '0') + itemTotal;
    const newTotal = newSubtotal + parseFloat(order.shipping_cost || '0');

    await db.execute(sql`
      UPDATE orders 
      SET subtotal = ${newSubtotal.toFixed(2)}, total_amount = ${newTotal.toFixed(2)}
      WHERE id = ${orderId}
    `);

    return NextResponse.json({
      success: true,
      item: newItem,
      message: "Item added to order",
    });
  } catch (error) {
    console.error("Error adding order item:", error);
    return NextResponse.json(
      { error: "Failed to add item to order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    // Get the item using raw SQL
    const itemResult = await db.execute(sql`
      SELECT id, order_id, unit_price, quantity 
      FROM order_items 
      WHERE id = ${parseInt(itemId)} 
      LIMIT 1
    `);

    if (!itemResult.rows || itemResult.rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    const item = itemResult.rows[0] as { id: number; order_id: number; unit_price: string; quantity: number };

    if (item.order_id !== orderId) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Delete the item
    await db.execute(sql`DELETE FROM order_items WHERE id = ${parseInt(itemId)}`);

    // Update order totals
    const orderResult = await db.execute(sql`
      SELECT id, subtotal, shipping_cost 
      FROM orders 
      WHERE id = ${orderId} 
      LIMIT 1
    `);
    
    if (orderResult.rows && orderResult.rows.length > 0) {
      const order = orderResult.rows[0] as { id: number; subtotal: string; shipping_cost: string };
      const itemTotal = parseFloat(item.unit_price) * item.quantity;
      const newSubtotal = Math.max(0, parseFloat(order.subtotal || '0') - itemTotal);
      const newTotal = newSubtotal + parseFloat(order.shipping_cost || '0');

      await db.execute(sql`
        UPDATE orders 
        SET subtotal = ${newSubtotal.toFixed(2)}, total_amount = ${newTotal.toFixed(2)}
        WHERE id = ${orderId}
      `);
    }

    return NextResponse.json({
      success: true,
      message: "Item removed from order",
    });
  } catch (error) {
    console.error("Error removing order item:", error);
    return NextResponse.json(
      { error: "Failed to remove item from order" },
      { status: 500 }
    );
  }
}
