export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const session = await getServerSession(authOptions);

    if (!token || token.length < 32) {
      return NextResponse.json({ message: "Invalid token" }, { status: 400 });
    }

    // Use raw SQL to search for token in notes field (production compatible)
    const result = await db.execute(sql`
      SELECT id, order_number, user_id, status, total_amount, notes
      FROM orders 
      WHERE notes LIKE ${'%Payment Link: ' + token + '%'}
      LIMIT 1
    `);

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const orderRow = result.rows[0] as any;
    const order = {
      id: orderRow.id,
      orderNumber: orderRow.order_number,
      userId: orderRow.user_id,
      status: orderRow.status,
      totalAmount: orderRow.total_amount,
    };

    // Allow pending and pending_payment statuses
    const payableStatuses = ["pending", "pending_payment", "awaiting_artwork"];
    if (!payableStatuses.includes(order.status)) {
      return NextResponse.json(
        { message: "Order has already been processed" },
        { status: 400 }
      );
    }

    // Link order to user if logged in and not already linked
    if (session?.user && !order.userId) {
      const userId = String((session.user as any).id);
      await db.execute(sql`
        UPDATE orders SET user_id = ${userId} WHERE id = ${order.id}
      `);
    }

    const siteUrl = process.env.SITE_URL || "https://stickybanditos.com";
    const checkoutUrl = `${siteUrl}/checkout?orderId=${order.id}&token=${token}`;

    return NextResponse.json({
      checkoutUrl,
      message: "Redirecting to checkout",
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ message: "Payment processing failed" }, { status: 500 });
  }
}
