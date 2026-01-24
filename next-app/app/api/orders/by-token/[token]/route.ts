export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, products, users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token || token.length < 32) {
      return NextResponse.json({ message: "Invalid token" }, { status: 400 });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.paymentLinkToken, token))
      .limit(1);

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        selectedOptions: orderItems.selectedOptions,
        productName: products.name,
        productThumbnail: products.thumbnailUrl,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    const formattedItems = items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      selectedOptions: item.selectedOptions,
      product: {
        name: item.productName,
        thumbnailUrl: item.productThumbnail,
      },
    }));

    // Check if customer email has an existing account or if order is already linked
    let hasAccount = false;
    if (order.userId) {
      hasAccount = true;
    } else if (order.customerEmail) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, order.customerEmail),
      });
      hasAccount = !!existingUser;
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      hasAccount,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      items: formattedItems,
    });
  } catch (error) {
    console.error("Error fetching order by token:", error);
    return NextResponse.json({ message: "Failed to fetch order" }, { status: 500 });
  }
}
