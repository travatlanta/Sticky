export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses = ['pending', 'pending_payment', 'paid', 'in_production', 'printed', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    console.log(`[Admin Status Update] Updating order ${orderId} status to '${status}'`);

    // Get current status for logging
    const currentOrder = await db.execute(sql`
      SELECT id, order_number, status FROM orders WHERE id = ${orderId}
    `);

    if (!currentOrder.rows || currentOrder.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const oldStatus = (currentOrder.rows[0] as any).status;
    console.log(`[Admin Status Update] Order ${orderId} current status: '${oldStatus}' -> new status: '${status}'`);

    // Update status using raw SQL
    await db.execute(sql`UPDATE orders SET status = ${status} WHERE id = ${orderId}`);

    console.log(`[Admin Status Update] Order ${orderId} status successfully updated to '${status}'`);

    return NextResponse.json({ 
      success: true, 
      orderId,
      oldStatus,
      newStatus: status,
      message: `Order status updated from '${oldStatus}' to '${status}'`
    });
  } catch (error: any) {
    console.error("[Admin Status Update] Error:", error);
    return NextResponse.json({ message: error.message || "Failed to update status" }, { status: 500 });
  }
}
