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

    // Subtotal only (no shipping). Convert to a number for tax calculation.
    const subtotal = items.reduce(
      (sum, i) => sum + Number(i.unitPrice ?? '0') * i.quantity,
      0
    );

    // Compute tax amount based on the combined Arizona (state), Maricopa County, and Phoenix city tax rates.
    // As of July 1, 2025, the combined rate is 9.1% (state 5.6%, county 0.7%, city 2.8%)【774609075341561†L124-L131】.
    const TAX_RATE = 0.091;
    const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));

    // Shipping cost is currently disabled and set to zero by default.
    const shippingCost = 0;

    // Allow free orders: if the subtotal is zero or less, skip payment processing and create a paid order directly.
    if (subtotal <= 0) {
      // Lookup the current authenticated user to associate the order with their account.
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id ?? null;
      // Create the order with zero shipping cost and mark it as paid.
      const [order] = await db
        .insert(orders)
        .values({
          userId,
          status: 'paid',
          subtotal: subtotal.toFixed(2),
          taxAmount: '0',
          shippingCost: '0',
          totalAmount: subtotal.toFixed(2),
          shippingAddress: shippingAddress ?? null,
        })
        .returning();
      // Create order items referencing the cart items.
      for (const item of items) {
        await db.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice ?? '0'),
        });
      }
      // Clear the cart and its items.
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      return noCache(
        NextResponse.json({ success: true, orderId: order.id })
      );
    }

    // Construct payload for Square API. Include taxes and shipping in the amount charged.
    const totalForPayment = subtotal + taxAmount + shippingCost;
    const amountInCents = Math.round(totalForPayment * 100);
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

    // Compute total by adding subtotal, tax, and shipping.
    const total = subtotal + taxAmount + shippingCost;
    // Create order with calculated tax amount and shipping cost, associated with the current user
    const [order] = await db
      .insert(orders)
      .values({
        userId,
        status: 'paid',
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        totalAmount: total.toFixed(2),
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