export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carts, cartItems } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const CART_EXPIRY_DAYS = 60;

async function getOrCreateCart(sessionId: string, userId?: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CART_EXPIRY_DAYS);
  
  try {
    // First, try to find existing cart by session ID
    const existingCarts = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId))
      .limit(1);
    
    if (existingCarts && existingCarts.length > 0) {
      const cart = existingCarts[0];
      // Update expiry
      await db.update(carts)
        .set({ expiresAt, updatedAt: new Date() })
        .where(eq(carts.id, cart.id));
      console.log('[Cart Add] Found existing cart by sessionId:', cart.id);
      return cart;
    }
    
    // If user is logged in, also check for user cart
    if (userId) {
      const userCarts = await db
        .select()
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1);
      
      if (userCarts && userCarts.length > 0) {
        const cart = userCarts[0];
        // Update sessionId to match client's sessionId
        await db.update(carts)
          .set({ sessionId, expiresAt, updatedAt: new Date() })
          .where(eq(carts.id, cart.id));
        console.log('[Cart Add] Found user cart, updated sessionId:', cart.id);
        return { ...cart, sessionId };
      }
    }
    
    // Create new cart
    const newCarts = await db.insert(carts).values({ 
      sessionId, 
      userId: userId || null,
      expiresAt 
    }).returning();
    
    if (newCarts && newCarts.length > 0) {
      console.log('[Cart Add] Created new cart:', newCarts[0].id);
      return newCarts[0];
    }
    
    throw new Error('Failed to create cart');
  } catch (error) {
    console.error('[Cart Add] Database error in getOrCreateCart:', error);
    throw error;
  }
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
    
    // Priority: header (case insensitive) > cookie > fallback cookie > generate new
    // Note: Headers in fetch API are case-insensitive per HTTP spec
    let sessionId = request.headers.get('x-cart-session-id') || request.headers.get('X-Cart-Session-Id') || '';
    if (!sessionId) {
      sessionId = cookieStore.get('cart-session-id')?.value || '';
    }
    if (!sessionId) {
      sessionId = cookieStore.get('guest_session_id')?.value || '';
    }
    
    // Get user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    
    console.log('[Cart Add] Header Session:', request.headers.get('X-Cart-Session-Id'), '| Cookie Session:', cookieStore.get('cart-session-id')?.value, '| User ID:', userId || 'GUEST');
    
    if (!sessionId) {
      sessionId = randomUUID();
      console.log('[Cart Add] Generated new session ID:', sessionId);
    }

    const cart = await getOrCreateCart(sessionId, userId);
    console.log('[Cart Add] Using cart ID:', cart.id, '| Cart userId:', cart.userId, '| Cart sessionId:', cart.sessionId);

    // Ensure unitPrice is always a valid string (default to '0' for free products)
    let unitPrice = '0';
    if (body.unitPrice !== undefined && body.unitPrice !== null && body.unitPrice !== '') {
      const parsed = parseFloat(String(body.unitPrice));
      unitPrice = isNaN(parsed) ? '0' : parsed.toString();
    }

    // Insert new cart item (cutType disabled until production DB is updated)
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
      .returning({
        id: cartItems.id,
        cartId: cartItems.cartId,
        productId: cartItems.productId,
        designId: cartItems.designId,
        quantity: cartItems.quantity,
        selectedOptions: cartItems.selectedOptions,
        unitPrice: cartItems.unitPrice,
        mediaType: cartItems.mediaType,
        finishType: cartItems.finishType,
        createdAt: cartItems.createdAt,
      });

    // Return response with explicit Set-Cookie header
    const response = NextResponse.json({ ...item, sessionId });
    response.cookies.set({
      name: 'cart-session-id',
      value: sessionId,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 60, // 60 days
    });
    return response;
  } catch (error) {
    console.error('Error adding to cart:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ 
      message: 'Failed to add to cart',
      error: errorMessage,
      stack: errorStack,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlStart: process.env.DATABASE_URL?.substring(0, 30) + '...',
        isVercel: process.env.VERCEL === '1',
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}

// OPTIONS handler to support CORS preflight requests.  Some browsers
// will send an OPTIONS request before a POST when the request has
// non-simple headers (such as application/json).  Returning a 200
// response here avoids a 405 Method Not Allowed error.
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}