export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, notifications, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    if (order.artworkStatus !== "pending_approval") {
      return NextResponse.json({ 
        message: "No design pending approval" 
      }, { status: 400 });
    }

    await db
      .update(orders)
      .set({
        artworkStatus: "approved",
        artworkApprovedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    const admins = await db.query.users.findMany({
      where: eq(users.isAdmin, true),
    });

    for (const admin of admins) {
      await db.insert(notifications).values({
        userId: admin.id,
        type: "artwork_approved",
        title: "Design Approved",
        message: `Customer approved design for order #${order.orderNumber}`,
        link: `/admin/orders/${orderId}`,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Design approved successfully" 
    });
  } catch (error) {
    console.error("Error approving design:", error);
    return NextResponse.json({ message: "Failed to approve design" }, { status: 500 });
  }
}
