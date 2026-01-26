export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, notifications, designs, orderItems } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
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

    // Tag design as admin-uploaded for status logic
    const [design] = await db.insert(designs).values({
      userId: session.user.id,
      name: `[ADMIN_DESIGN] Design for Order #${order.orderNumber}`,
      previewUrl: blob.url,
      highResExportUrl: blob.url,
      status: "submitted",
    }).returning();

    console.log(`[Admin Artwork Upload] Created design ${design.id} for order ${orderId}`);

    // CRITICAL: Update ALL order_items to link to this design
    // This ensures customer can see the artwork regardless of schema differences
    await db.update(orderItems)
      .set({ designId: design.id })
      .where(eq(orderItems.orderId, orderId));
    
    console.log(`[Admin Artwork Upload] Updated order_items.design_id for order ${orderId}`);

    // Try to also update orders.adminDesignId (may not exist in production)
    try {
      await db.execute(sql`
        UPDATE orders 
        SET admin_design_id = ${design.id}, updated_at = NOW()
        WHERE id = ${orderId}
      `);
      console.log(`[Admin Artwork Upload] Updated orders.admin_design_id for order ${orderId}`);
    } catch (e: any) {
      console.log(`[Admin Artwork Upload] orders.admin_design_id column may not exist: ${e.message}`);
    }

    // NOTE: No notification/email sent here - email only sent when admin explicitly requests revision

    return NextResponse.json({ 
      success: true,
      designId: design.id,
      message: "Design uploaded successfully. Customer will see this artwork on their order page."
    });
  } catch (error) {
    console.error("Error uploading admin design:", error);
    return NextResponse.json({ message: "Failed to upload design" }, { status: 500 });
  }
}
