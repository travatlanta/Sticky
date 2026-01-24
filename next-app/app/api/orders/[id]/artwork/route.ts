export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, products, designs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
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
      with: {
        items: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    let adminDesign = null;
    if (order.adminDesignId) {
      adminDesign = await db.query.designs.findFirst({
        where: eq(designs.id, order.adminDesignId),
      });
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      artworkStatus: order.artworkStatus || "awaiting_artwork",
      customerArtworkUrl: order.customerArtworkUrl,
      adminDesignId: order.adminDesignId,
      artworkNotes: order.artworkNotes,
      totalAmount: order.totalAmount,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        product: item.product ? {
          name: item.product.name,
          imageUrl: item.product.imageUrl,
        } : null,
      })),
      adminDesign: adminDesign ? {
        id: adminDesign.id,
        name: adminDesign.name,
        thumbnailUrl: adminDesign.thumbnailUrl,
        canvasDataUrl: adminDesign.canvasDataUrl,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching order artwork:", error);
    return NextResponse.json({ message: "Failed to fetch order" }, { status: 500 });
  }
}
