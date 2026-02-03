export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, notifications, designs, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendOrderIssueFlaggedEmail, sendArtworkApprovedByAdminEmail, sendArtworkApprovalEmail } from "@/lib/email/sendNotificationEmails";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    // Await params for Next.js 14 compatibility
    const { id } = await params;
    const orderId = parseInt(id);
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
        orderId: orderId,
        linkUrl: `/orders/${orderId}/artwork`,
      });
      
      // Send email notification to customer
      const user = await db.query.users.findFirst({
        where: eq(users.id, order.userId),
      });
      
      if (user?.email) {
        await sendArtworkApprovalEmail({
          customerEmail: user.email,
          customerName: user.firstName || user.email.split('@')[0],
          orderNumber: order.orderNumber,
          orderId: orderId,
          artworkPreviewUrl: '',
          isFlagged: artworkStatus === 'needs_revision',
        });
      }
    }
    
    // Send email when artwork is approved by admin
    if (artworkStatus === 'approved' && order.userId) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, order.userId),
      });
      
      if (user?.email) {
        await sendArtworkApprovedByAdminEmail({
          customerEmail: user.email,
          customerName: user.firstName || user.email.split('@')[0],
          orderNumber: order.orderNumber,
          orderId: orderId,
        });
      }
    }
    
    // Send email when there's an issue with artwork (flagged/needs revision)
    if ((artworkStatus === 'needs_revision' || artworkStatus === 'flagged') && order.userId) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, order.userId),
      });
      
      if (user?.email) {
        await sendOrderIssueFlaggedEmail({
          customerEmail: user.email,
          customerName: user.firstName || user.email.split('@')[0],
          orderNumber: order.orderNumber,
          orderId: orderId,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating artwork status:", error);
    return NextResponse.json({ message: "Failed to update artwork status" }, { status: 500 });
  }
}
