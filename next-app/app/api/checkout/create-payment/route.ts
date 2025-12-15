export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carts, cartItems, orders, orderItems } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

// Square SDK (CommonJS import to avoid TS export issues)
const Square = require('square');

function noCache(res: NextResponse) {
  res.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceId, shippingAddress } = body;

    if (!sourceId) {
      return noCache(
        NextResponse.json(
          { error: 'Missing payment source' },
          { status: 400 }
        )
      );
    }

    const sessionId = cookies().get('cart-session-id')?.value;

    if (!sessionId) {
      return noCache(
        NextResponse.json({ error: 'Cart not found' }, { status: 400 })
      );
    }

    // Fetch cart (no relations)
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

    // Fetch cart items separately
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    if (items.length === 0) {
      return noCache(
        NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      );
    }

    // Runtime-safe totals (Drizzle typing workaround)
    const cartRow = cart as any;
    const totalAmount = Number(cartRow.totalAmount ?? cartRow.total ?? 0);
    const subtotal = Number(cartRow.subtotal ?? totalAmount);

    if (totalAmount <= 0) {
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
    await square.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: Math.round(totalAmount * 100),
        currency: 'USD',
      },
      shippingAddress: {
        addressLine1: shippingAddress.address1,
        addressLine2: shippingAddress.address2 || undefined,
        locality: shippingAddress.city,
        administrativeDistrictLevel1: shippingAddress.state,
        postalCode: shippingAddress.zip,
        country: 'US',
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
      },
    });

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        subtotal: String(subtotal),
        totalAmount: String(totalAmount),
        status: 'paid',
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

    return noCache(
      NextResponse.json({ success: true, orderId: order.id })
    );
  } catch (err: any) {
    // 🔴 TEMPORARY DEBUG — DO NOT REMOVE UNTIL SQUARE ERROR IS CONFIRMED
    console.error(
      'Square error:',
      err?.errors ?? err?.response?.body ?? err
    );

    return noCache(
      NextResponse.json(
        {
          error: 'Payment failed',
          square: err?.errors ?? err?.response?.body ?? err,
        },
        { status: 400 }
      )
    );
  }
}
