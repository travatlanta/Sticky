import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

// CommonJS Square import (required for your SDK version)
const Square = require('square');

import { db } from '../../../../lib/db';
import { carts, cartItems, orders, orderItems } from '../../../../shared/schema';

export const dynamic = 'force-dynamic';

function noCache(res: NextResponse) {
  res.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  return res;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sourceId, shippingAddress } = body;

    if (!sourceId) {
      return noCache(
        NextResponse.json({ error: 'Missing payment source' }, { status: 400 })
      );
    }

    const sessionId = cookies().get('cart-session-id')?.value;
    if (!sessionId) {
      return noCache(
        NextResponse.json({ error: 'No cart session' }, { status: 400 })
      );
    }

    // Fetch cart
    const cart = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId))
      .limit(1)
      .then(rows => rows[0]);

    if (!cart) {
      return noCache(
        NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      );
    }

    // Fetch cart items
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    if (items.length === 0) {
      return noCache(
        NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      );
    }

    // Calculate subtotal (NO SHIPPING)
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.unitPrice ?? '0') * item.quantity,
      0
    );

    if (subtotal <= 0) {
      return noCache(
        NextResponse.json({ error: 'Invalid cart total' }, { status: 400 })
      );
    }

    // Initialize Square client
    const square = new Square.Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN!,
      environment:
        process.env.NODE_ENV === 'production'
          ? 'production'
          : 'sandbox',
    });

    // Create Square payment
    const payment = await square.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: Math.round(subtotal * 100),
        currency: 'USD',
      },
      billingAddress: {
        firstName: shippingAddress?.firstName,
        lastName: shippingAddress?.lastName,
        addressLine1: shippingAddress?.address1,
        addressLine2: shippingAddress?.address2,
        locality: shippingAddress?.city,
        administrativeDistrictLevel1: shippingAddress?.state,
        postalCode: shippingAddress?.zip,
        country: 'US',
      },
    });

    if (!payment.result.payment || payment.result.payment.status !== 'COMPLETED') {
      return noCache(
        NextResponse.json({ error: 'Payment failed' }, { status: 400 })
      );
    }

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        status: 'paid',
        subtotal: subtotal.toString(),
        totalAmount: subtotal.toString(),
      })
      .returning();

    // Create order items — NULL-SAFE
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice ?? '0'),
      });
    }

    // Clear cart
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    return noCache(
      NextResponse.json({ success: true, orderId: order.id })
    );
  } catch (err) {
    console.error('Checkout route fatal error:', err);
    return noCache(
      NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
    );
  }
}
