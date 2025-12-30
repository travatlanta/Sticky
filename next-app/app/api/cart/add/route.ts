export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carts, cartItems } from '@shared/schema';
import { eq, and, or, gt, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const CART_EXPIRY_DAYS = 60;

async function getOrCreateCart(sessionId: string, userId?: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CART_EXPIRY_DAYS);
  
  let cart = null;
  
  // If user is logged in, try to find their user cart first
  if (userId) {
    const [userCart] = await db
      .select()
      .from(carts)
      .where(and(
        eq(carts.userId, userId),
        or(gt(carts.expiresAt, new Date()), isNull(carts.expiresAt))
      ));
    
    if (userCart) {
      cart = userCart;
    } else {
      // Check if there's a session cart to convert to user cart
      const [sessionCart] = await db
        .select()
        .from(carts)
        .where(eq(carts.sessionId, sessionId));
      
      if (sessionCart) {
        const [updatedCart] = await db
          .update(carts)
          .set({ userId, expiresAt, updatedAt: new Date() })
          .where(eq(carts.id, sessionCart.id))
          .returning();
        cart = updatedCart;
      }
    }
  }
  
  // If no cart found yet, look for session cart
  if (!cart) {
    const [sessionCart] = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId));
    
    if (sessionCart) {
      cart = sessionCart;
      await db.update(carts)
        .set({ expiresAt, updatedAt: new Date() })
        .where(eq(carts.id, cart.id));
    }
  }
  
  // Create new cart if none exists
  if (!cart) {
    [cart] = await db.insert(carts).values({ 
      sessionId, 
      userId: userId || null,
      expiresAt 
    }).returning();
  }
  
  return cart;
}

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (err) {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    }

    const cookieStore = await cookies();
    let sessionId = cookieStore.get('cart-session-id')?.value;
    
    // Get user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    
    console.log('[Cart Add] Session ID:', sessionId || 'NONE', '| User ID:', userId || 'GUEST');
    
    if (!sessionId) {
      sessionId = randomUUID();
      console.log('[Cart Add] Generated new session ID:', sessionId);
      cookieStore.set({
        name: 'cart-session-id',
        value: sessionId,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      });
    }

    const cart = await getOrCreateCart(sessionId, userId);

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