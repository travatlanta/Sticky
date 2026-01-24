export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, notifications, users } from "@shared/schema";
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

    if (!["awaiting_artwork", "revision_requested"].includes(order.artworkStatus || "")) {
      return NextResponse.json({ 
        message: "Cannot upload artwork at this stage" 
      }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

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

    const filename = `artwork/order-${orderId}-${Date.now()}${ext}`;
    const blob = await put(filename, file, {
      access: "public",
    });

    await db
      .update(orders)
      .set({
        customerArtworkUrl: blob.url,
        artworkStatus: "artwork_uploaded",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    const admins = await db.query.users.findMany({
      where: eq(users.isAdmin, true),
    });

    for (const admin of admins) {
      await db.insert(notifications).values({
        userId: admin.id,
        type: "artwork_submitted",
        title: "New Artwork Uploaded",
        message: `Customer uploaded artwork for order #${order.orderNumber}`,
        orderId: orderId,
        linkUrl: `/admin/orders/${orderId}`,
      });
    }

    return NextResponse.json({ 
      success: true, 
      artworkUrl: blob.url,
      message: "Artwork uploaded successfully" 
    });
  } catch (error) {
    console.error("Error uploading artwork:", error);
    return NextResponse.json({ message: "Failed to upload artwork" }, { status: 500 });
  }
}
