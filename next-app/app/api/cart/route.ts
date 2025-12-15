export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carts, cartItems, products, designs } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

function noCache(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

export async function GET() {
  try {
    const cookieStore = cookies();
    let sessionId = cookieStore.get('cart-session-id')?.value;

    if (!sessionId) {
      sessionId = randomUUID();
      cookieStore.set({
        name: 'cart-session-id',
        value: sessionId,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      });
    }

    let [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId));

    if (!cart) {
      [cart] = await db.insert(carts).values({ sessionId }).returning();
    }

    const items = await db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        unitPrice: cartItems.unitPrice,
        selectedOptions: cartItems.selectedOptions,
        product: products,
        design: designs,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(designs, eq(cartItems.designId, designs.id))
      .where(eq(cartItems.cartId, cart.id));

    return noCache(NextResponse.json({ items }));
  } catch (error) {
    console.error('Error fetching cart:', error);
    return noCache(NextResponse.json({ items: [] }));
  }
}

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    }

    const cookieStore = cookies();
    let sessionId = cookieStore.get('cart-session-id')?.value;

    if (!sessionId) {
      sessionId = randomUUID();
      cookieStore.set({
        name: 'cart-session-id',
        value: sessionId,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      });
    }

    let [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId));

    if (!cart) {
      [cart] = await db.insert(carts).values({ sessionId }).returning();
    }

    const [item] = await db
      .insert(cartItems)
      .values({
        cartId: cart.id,
        productId: body.productId,
        designId: body.designId || null,
        quantity: body.quantity || 1,
        selectedOptions: body.selectedOptions || null,
        unitPrice: body.unitPrice || null,
      })
      .returning();

    return noCache(NextResponse.json(item));
  } catch (error) {
    console.error('Error adding to cart:', error);
    return noCache(NextResponse.json({ message: 'Failed to add to cart' }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return noCache(NextResponse.json({}));
}
