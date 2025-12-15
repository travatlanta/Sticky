import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems, cartItems, carts, products } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { computeShippingQuote } from '@/lib/shipping';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please log in to complete your order' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceId, shippingAddress, billingAddress } = body as {
      sourceId: string;
      shippingAddress?: ShippingAddress;
      billingAddress?: ShippingAddress;
    };

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Payment information is missing. Please try again.' },
        { status: 400 }
      );
    }

    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
    if (!locationId) {
      console.error('NEXT_PUBLIC_SQUARE_LOCATION_ID not configured');
      return NextResponse.json(
        { error: 'Payment system not properly configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Locate cart: prefer userId cart, otherwise fall back to cookie session cart.
    let userCart = await db.select().from(carts).where(eq(carts.userId, session.user.id)).limit(1);

    if (userCart.length === 0) {
      const sessionId = request.cookies.get("cart-session-id")?.value;
      if (sessionId) {
        userCart = await db.select().from(carts).where(eq(carts.sessionId, sessionId)).limit(1);
      }
    }

    if (userCart.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 404 });
    }

    const items = await db
      .select({
        cartItem: cartItems,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, userCart[0].id));

    if (items.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });
    }

    let subtotal = 0;
    for (const item of items) {
      const unitPrice = parseFloat(item.cartItem.unitPrice || item.product.basePrice);
      subtotal += unitPrice * item.cartItem.quantity;
    }

    let shippingCost = 15.00;

    if (shippingAddress) {
      const quoteItems = items.map((row) => ({
        quantity: row.cartItem.quantity,
        shippingType: (row.product as any).shippingType,
        flatShippingPrice: (row.product as any).flatShippingPrice,
      }));
      const quote = await computeShippingQuote(quoteItems, {
        state: shippingAddress.state,
        zip: shippingAddress.zip,
      });
      shippingCost = quote.shippingCost;
    }

    const taxAmount = 0;
    const totalAmount = subtotal + shippingCost + taxAmount;
    const amountInCents = Math.round(totalAmount * 100);

    const idempotencyKey = randomUUID();

    const paymentResponse = await squareClient.payments.create({
      sourceId,
      amountMoney: {
        amount: BigInt(amountInCents),
        currency: 'USD',
      },
      locationId,
      idempotencyKey,
      autocomplete: true,
      note: `Sticky Banditos order for ${session.user.email}`,
      buyerEmailAddress: session.user.email || undefined,
    });

    const payment = paymentResponse.payment;

    if (payment?.status === 'COMPLETED') {
      const [newOrder] = await db.insert(orders).values({
        userId: session.user.id,
        status: 'paid',
        subtotal: subtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : null,
        billingAddress: billingAddress ? JSON.stringify(billingAddress) : null,
        stripePaymentIntentId: payment.id,
      }).returning();

      for (const item of items) {
        await db.insert(orderItems).values({
          orderId: newOrder.id,
          productId: item.cartItem.productId,
          designId: item.cartItem.designId,
          quantity: item.cartItem.quantity,
          unitPrice: item.cartItem.unitPrice || item.product.basePrice,
          selectedOptions: item.cartItem.selectedOptions,
        });
      }

      await db.delete(cartItems).where(eq(cartItems.cartId, userCart[0].id));

      return NextResponse.json({
        success: true,
        orderId: newOrder.id,
        payment: {
          id: payment.id,
          status: payment.status,
          receiptUrl: payment.receiptUrl,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Payment was not completed. Please try again.',
      payment: {
        id: payment?.id,
        status: payment?.status,
      },
    }, { status: 400 });
  } catch (error: any) {
    console.error('Square payment error:', error);
    
    let errorMessage = 'Payment failed. Please try again.';
    
    if (error.errors && Array.isArray(error.errors)) {
      errorMessage = error.errors[0]?.detail || errorMessage;
    } else if (error.message) {
      if (error.message.includes('INVALID_CARD')) {
        errorMessage = 'Invalid card information. Please check your card details.';
      } else if (error.message.includes('CARD_DECLINED')) {
        errorMessage = 'Your card was declined. Please try a different payment method.';
      } else if (error.message.includes('INSUFFICIENT_FUNDS')) {
        errorMessage = 'Insufficient funds. Please try a different card.';
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
