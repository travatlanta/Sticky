export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carts, cartItems } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

// POST handler to add an item to the cart.  This route ensures that a
// session-based cart exists before inserting a new cart item.  If no
// cart-session-id cookie is present, one is generated and persisted.
export async function POST(request: Request) {
  try {
    // Parse the request body.  Some fetch calls may omit the
    // Content-Type header (e.g. to avoid CORS preflight).  In that
    // case, attempt to parse the body as JSON via text fallback.
    let body;
    try {
      body = await request.json();
    } catch (err) {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    }

    const cookieStore = cookies();
    let sessionId = cookieStore.get('cart-session-id')?.value;
    // Generate and persist a new session ID if none exists
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

    // Find or create cart associated with this session
    let [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId));

    if (!cart) {
      [cart] = await db
        .insert(carts)
        .values({ sessionId })
        .returning();
    }

    // Ensure unitPrice is always a valid string (default to '0' for free products)
    let unitPrice = '0';
    if (body.unitPrice !== undefined && body.unitPrice !== null && body.unitPrice !== '') {
      const parsed = parseFloat(String(body.unitPrice));
      unitPrice = isNaN(parsed) ? '0' : parsed.toString();
    }

    // Insert new cart item
    const [item] = await db
      .insert(cartItems)
      .values({
        cartId: cart.id,
        productId: body.productId,
        designId: body.designId || null,
        quantity: body.quantity || 1,
        selectedOptions: body.selectedOptions || null,
        unitPrice: unitPrice,
        mediaType: body.mediaType || null,
        finishType: body.finishType || null,
      })
      .returning();

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ message: 'Failed to add to cart' }, { status: 500 });
  }
}

// OPTIONS handler to support CORS preflight requests.  Some browsers
// will send an OPTIONS request before a POST when the request has
// non-simple headers (such as application/json).  Returning a 200
// response here avoids a 405 Method Not Allowed error.
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}