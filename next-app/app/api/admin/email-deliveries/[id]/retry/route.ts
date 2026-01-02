export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { emailDeliveries, orders, orderItems, products } from "@shared/schema";
import { sendOrderConfirmationEmail } from "@/lib/email/sendOrderConfirmationEmail";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const deliveryId = Number(params.id);
  if (!Number.isFinite(deliveryId)) {
    return NextResponse.json({ error: "Invalid delivery id" }, { status: 400 });
  }

  try {
    const [delivery] = await db
      .select({
        id: emailDeliveries.id,
        orderId: emailDeliveries.orderId,
        type: emailDeliveries.type,
        toEmail: emailDeliveries.toEmail,
        status: emailDeliveries.status,
      })
      .from(emailDeliveries)
      .where(eq(emailDeliveries.id, deliveryId))
      .limit(1);

    if (!delivery) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }

    // Only retry deliveries we manage
    if (delivery.type !== "order_confirmation") {
      return NextResponse.json(
        { error: "Unsupported delivery type" },
        { status: 400 }
      );
    }

    const [orderRow] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        subtotal: orders.subtotal,
        shippingCost: orders.shippingCost,
        taxAmount: orders.taxAmount,
        totalAmount: orders.totalAmount,
        shippingAddress: orders.shippingAddress,
      })
      .from(orders)
      .where(eq(orders.id, delivery.orderId))
      .limit(1);

    if (!orderRow) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = await db
      .select({
        name: products.name,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, delivery.orderId));

    const shipping = (orderRow.shippingAddress || {}) as any;
    const recipientName =
      shipping?.name ||
      [shipping?.firstName, shipping?.lastName].filter(Boolean).join(" ") ||
      "";

    const payload = {
      orderId: orderRow.id,
      toEmail: delivery.toEmail,
      orderNumber: orderRow.orderNumber,
      items: items.map((i) => ({
        name: i.name || "Item",
        quantity: Number(i.quantity || 0),
        unitPrice: i.unitPrice ? i.unitPrice.toString() : "0",
      })),
      totals: {
        subtotal: orderRow.subtotal ? orderRow.subtotal.toString() : "0",
        shipping: orderRow.shippingCost ? orderRow.shippingCost.toString() : "0",
        tax: orderRow.taxAmount ? orderRow.taxAmount.toString() : "0",
        total: orderRow.totalAmount ? orderRow.totalAmount.toString() : "0",
      },
      shippingAddress: {
        name: recipientName,
        address1: shipping?.address1 || shipping?.addressLine1 || "",
        address2: shipping?.address2 || shipping?.addressLine2 || "",
        city: shipping?.city || "",
        state: shipping?.state || "",
        zip: shipping?.zip || shipping?.postalCode || "",
        country: shipping?.country || "US",
      },
    };

    await sendOrderConfirmationEmail(payload as any);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Retry failed" },
      { status: 500 }
    );
  }
}
