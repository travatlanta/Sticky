export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { carts, cartItems, products } from "@shared/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { computeShippingQuote } from "@/lib/shipping";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const address = body?.shippingAddress || body?.address || body;

    const cookieStore = cookies();
    let sessionId = cookieStore.get("cart-session-id")?.value;
    if (!sessionId) {
      sessionId = randomUUID();
      cookieStore.set({
        name: "cart-session-id",
        value: sessionId,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      });
    }

    const [cart] = await db.select().from(carts).where(eq(carts.sessionId, sessionId));

    if (!cart) {
      return NextResponse.json({ shippingCost: 0, reason: "no-cart" });
    }

    const items = await db
      .select({
        cartItem: cartItems,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    const quoteItems = items.map((row) => ({
      quantity: row.cartItem.quantity,
      shippingType: (row.product as any).shippingType,
      flatShippingPrice: (row.product as any).flatShippingPrice,
    }));

    const { shippingCost, locationMultiplier } = await computeShippingQuote(quoteItems, {
      state: address?.state,
      zip: address?.zip,
    });

    return NextResponse.json({ shippingCost, locationMultiplier });
  } catch (error) {
    console.error("Error calculating shipping quote:", error);
    return NextResponse.json({ message: "Failed to calculate shipping quote" }, { status: 500 });
  }
}
