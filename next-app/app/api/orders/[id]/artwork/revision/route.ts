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

    const body = await request.json();
    const notes = body.notes?.trim();

    if (!notes) {
      return NextResponse.json({ 
        message: "Please describe the changes you'd like" 
      }, { status: 400 });
    }

    const existingNotes = order.artworkNotes || "";
    const updatedNotes = existingNotes 
      ? `${existingNotes}\n\n---\nCustomer revision request:\n${notes}`
      : `Customer revision request:\n${notes}`;

    await db
      .update(orders)
      .set({
        artworkStatus: "revision_requested",
        artworkNotes: updatedNotes,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    const admins = await db.query.users.findMany({
      where: eq(users.isAdmin, true),
    });

    for (const admin of admins) {
      await db.insert(notifications).values({
        userId: admin.id,
        type: "artwork_revision_requested",
        title: "Revision Requested",
        message: `Customer requested changes for order #${order.orderNumber}: ${notes.substring(0, 100)}${notes.length > 100 ? '...' : ''}`,
        orderId: orderId,
        linkUrl: `/admin/orders/${orderId}`,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Revision request submitted" 
    });
  } catch (error) {
    console.error("Error requesting revision:", error);
    return NextResponse.json({ message: "Failed to submit revision request" }, { status: 500 });
  }
}
