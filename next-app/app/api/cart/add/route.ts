import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { carts, cartItems } from "@shared/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { productId, designId, quantity, selectedOptions } = await req.json();

    if (!productId || !quantity) {
      return NextResponse.json({ error: "Missing product or quantity" }, { status: 400 });
    }

    let sessionId = cookies().get("cart-session-id")?.value;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      cookies().set("cart-session-id", sessionId, { httpOnly: true, path: "/" });
    }

    let cart = await db.select().from(carts).where(eq(carts.sessionId, sessionId)).then(r => r[0]);
    if (!cart) {
      [cart] = await db.insert(carts).values({ sessionId }).returning();
    }

    await db.insert(cartItems).values({
      cartId: cart.id,
      productId,
      designId: designId ?? null,
      quantity,
      selectedOptions: selectedOptions ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CART ADD ERROR:", err);
    return NextResponse.json({ error: "Failed to add item to cart" }, { status: 500 });
  }
}
