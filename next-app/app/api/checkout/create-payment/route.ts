import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { Client } from 'square';

import { db } from '../../../../server/db';
import { carts, cartItems, orders, orderItems } from '../../../../server/db/schema';

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

    const sessionId = cookies().get('cart_session')?.value;
    if (!sessionId) {
      return noCache(
        NextResponse.json({ error: 'No cart session' }, { status: 400 })
      );
    }

    const cart = await db.query.carts.findFirst({
      where: (c, { eq }) => eq(c.sessionId, sessionId),
      with: {
        items: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      return noCache(
        NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      );
    }

    // 🔒 NO SHIPPING — subtotal only
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    if (subtotal <= 0) {
      return noCache(
        NextResponse.json({ error: 'Invalid cart total' }, { status: 400 })
      );
    }

    // ✅ Square client — CORRECT SDK USAGE
    const square = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN!,
      environment:
        process.env.NODE_ENV === 'production'
          ? 'production'
          : 'sandbox',
    });

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

    const [order] = await db
      .insert(orders)
      .values({
        sessionId,
        status: 'paid',
        subtotal: subtotal.toString(),
        totalAmount: subtotal.toString(),
      })
      .returning();

    for (const item of cart.items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      });
    }

    await db.delete(cartItems).where(
      (ci, { eq }) => eq(ci.cartId, cart.id)
    );

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
