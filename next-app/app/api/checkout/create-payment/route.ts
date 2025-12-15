import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../../../lib/db';
import { carts, cartItems, orders, orderItems } from '../../../../shared/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    // Subtotal only (no shipping)
    const subtotal = items.reduce(
      (sum, i) => sum + Number(i.unitPrice ?? '0') * i.quantity,
      0
    );

    if (subtotal <= 0) {
      return noCache(
        NextResponse.json({ error: 'Invalid cart total' }, { status: 400 })
      );
    }

    // Construct payload for Square API
    const amountInCents = Math.round(subtotal * 100);
    const paymentPayload = {
      source_id: sourceId,
      idempotency_key: randomUUID(),
      location_id: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
      amount_money: {
        amount: amountInCents,
        currency: 'USD',
      },
      billing_address: {
        first_name: shippingAddress?.firstName,
        last_name: shippingAddress?.lastName,
        address_line_1: shippingAddress?.address1,
        address_line_2: shippingAddress?.address2,
        locality: shippingAddress?.city,
        administrative_district_level_1: shippingAddress?.state,
        postal_code: shippingAddress?.zip,
        country: 'US',
      },
    };

    // Call Square Payments API directly
    const accessToken = process.env.SQUARE_ACCESS_TOKEN!;
    const response = await fetch('https://connect.squareup.com/v2/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-05-22',
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentResult = await response.json();
    const payment = paymentResult.payment;

    if (!payment || payment.status !== 'COMPLETED') {
      return noCache(
        NextResponse.json(
          { error: paymentResult?.errors?.[0]?.detail || 'Payment failed' },
          { status: 400 }
        )
      );
    }

    // Lookup the current authenticated user to associate the order with their account.
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    // Create order with explicit zero shipping cost and associated user
    const [order] = await db
      .insert(orders)
      .values({
        userId,
        status: 'paid',
        subtotal: subtotal.toString(),
        // Shipping is disabled, so set shipping cost to zero
        shippingCost: '0',
        totalAmount: subtotal.toString(),
        // Persist the provided shipping address on the order for future reference
        shippingAddress: shippingAddress ?? null,
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