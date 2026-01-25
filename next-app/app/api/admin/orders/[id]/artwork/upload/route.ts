export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, notifications, designs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const notes = formData.get("notes") as string;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".eps", ".ai", ".psd", ".cdr"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ 
        message: "Invalid file type. Allowed: JPG, PNG, GIF, WebP, PDF, EPS, AI, PSD, CDR" 
      }, { status: 400 });
    }

    const filename = `admin-designs/order-${orderId}-${Date.now()}${ext}`;
    
    const blob = await put(filename, file, {
      access: "public",
    });

    const [design] = await db.insert(designs).values({
      userId: session.user.id,
      name: `Design for Order #${order.orderNumber}`,
      previewUrl: blob.url,
      highResExportUrl: blob.url,
      status: "submitted",
    }).returning();

    const existingNotes = order.artworkNotes || "";
    const updatedNotes = notes 
      ? (existingNotes ? `${existingNotes}\n\n---\nAdmin notes:\n${notes}` : `Admin notes:\n${notes}`)
      : existingNotes;

    await db.update(orders).set({
      adminDesignId: design.id,
      artworkStatus: "pending_approval",
      artworkNotes: updatedNotes,
      updatedAt: new Date(),
    }).where(eq(orders.id, orderId));

    if (order.userId) {
      await db.insert(notifications).values({
        userId: order.userId,
        type: "artwork_pending_approval",
        title: "Design Ready for Review",
        message: `Your design for order #${order.orderNumber} is ready. Please review and approve.`,
        orderId: orderId,
        linkUrl: `/orders/${orderId}/artwork`,
      });
    }

    return NextResponse.json({ 
      success: true,
      designId: design.id,
      message: "Design uploaded and sent for customer approval"
    });
  } catch (error) {
    console.error("Error uploading admin design:", error);
    return NextResponse.json({ message: "Failed to upload design" }, { status: 500 });
  }
}
