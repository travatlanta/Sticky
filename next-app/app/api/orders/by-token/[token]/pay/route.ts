export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, notifications, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const session = await getServerSession(authOptions);

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

    if (order.status !== "pending_payment") {
      return NextResponse.json(
        { message: "Order has already been processed" },
        { status: 400 }
      );
    }

    if (session?.user && !order.userId) {
      const userId = (session.user as any).id;
      await db
        .update(orders)
        .set({ 
          userId,
          updatedAt: new Date()
        })
        .where(eq(orders.id, order.id));
    }

    const siteUrl = process.env.SITE_URL || "http://localhost:5000";
    const checkoutUrl = `${siteUrl}/checkout?orderId=${order.id}&token=${token}`;

    return NextResponse.json({
      checkoutUrl,
      message: "Redirecting to checkout",
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ message: "Payment processing failed" }, { status: 500 });
  }
}
