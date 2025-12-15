export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carts, orders, orderItems } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import Square from 'square';

function noCache(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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
        NextResponse.json({ error: 'Missing payment source' }, { status: 400 })
      );
    }

    const sessionId = cookies().get('cart-session-id')?.value;

    if (!sessionId) {
      return noCache(
        NextResponse.json({ error: 'Cart not found' }, { status: 400 })
      );
    }

    const cart = await db.query.carts.findFirst({
      where: eq(carts.sessionId, sessionId),
      with: {
        items: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!cart || !cart.items) {
      return noCache(
        NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      );
    }

    // 🔧 Drizzle typing fix
    const items = cart.items as any[];

    if (items.length === 0) {
      return noCache(
        NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      );
    }

    const total = Number((cart as any).total ?? 0);

    if (total <= 0) {
      return noCache(
        NextResponse.json({ error: 'Invalid cart total' }, { status: 400 })
      );
    }

    const square = new Square.Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN!,
      environment:
        process.env.NODE_ENV === 'production'
          ? 'production'
          : 'sandbox',
    });

    await square.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: Math.round(total * 100),
        currency: 'USD',
      },
      shippingAddress: {
        addressLine1: shippingAddress.address1,
        addressLine2: shippingAddress.address2 || undefined,
        locality: shippingAddress.city,
        administrativeDistrictLevel1: shippingAddress.state,
        postalCode: shippingAddress.zip,
        country: 'US',
      },
    });

    const [order] = await db
      .insert(orders)
      .values({
        total,
        status: 'paid',
      })
      .returning();

    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }

    return noCache(
      NextResponse.json({ success: true, orderId: order.id })
    );
  } catch (err) {
    console.error('Checkout payment error:', err);
    return noCache(
      NextResponse.json({ error: 'Payment failed' }, { status: 500 })
    );
  }
}
