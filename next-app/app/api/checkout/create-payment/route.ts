import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { createClient } from 'square';

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
    const { sourceId, shippingAddress } = await req.json();

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
      .then(r => r[0]);

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

    if (!items.length) {
      return noCache(
        NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      );
    }

    // Subtotal ONLY (no shipping)
    const subtotal = items.reduce(
      (sum, i) => sum + Number(i.unitPrice ?? '0') * i.quantity,
      0
    );

    if (subtotal <= 0) {
      return noCache(
        NextResponse.json({ error: 'Invalid cart total' }, { status: 400 })
      );
    }

    // ✅ CORRECT Square initialization (APIMatic SDK)
    const square = createClient({
      bearerAuthCredentials: {
        accessToken: process.env.SQUARE_ACCESS_TOKEN!,
      },
      environment: 'production',
    });

    // Create payment
    const paymentResult = await square.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: randomUUID(),
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
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

    const payment = paymentResult.result.payment;

    if (!payment || payment.status !== 'COMPLETED') {
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

    // Create order items
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
