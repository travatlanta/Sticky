export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, notifications, designs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
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

    const body = await request.json();
    const { artworkStatus, artworkNotes, adminDesignId } = body;

    const updateData: any = { updatedAt: new Date() };
    
    if (artworkStatus) {
      updateData.artworkStatus = artworkStatus;
    }
    if (artworkNotes !== undefined) {
      updateData.artworkNotes = artworkNotes;
    }
    if (adminDesignId !== undefined) {
      updateData.adminDesignId = adminDesignId;
    }

    await db.update(orders).set(updateData).where(eq(orders.id, orderId));

    if (artworkStatus === 'pending_approval' && order.userId) {
      await db.insert(notifications).values({
        userId: order.userId,
        type: "artwork_pending_approval",
        title: "Design Ready for Review",
        message: `Your design for order #${order.orderNumber} is ready for approval.`,
        link: `/orders/${orderId}/artwork`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating artwork status:", error);
    return NextResponse.json({ message: "Failed to update artwork status" }, { status: 500 });
  }
}
