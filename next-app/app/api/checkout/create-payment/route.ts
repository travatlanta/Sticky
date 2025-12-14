import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems, cartItems, carts, products } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { sourceId, shippingAddress, billingAddress } = await request.json();

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Missing required field: sourceId (payment token)' },
        { status: 400 }
      );
    }

    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
    if (!locationId) {
      return NextResponse.json(
        { error: 'Square location ID not configured' },
        { status: 500 }
      );
    }

    const userCart = await db.select().from(carts).where(eq(carts.userId, session.user.id)).limit(1);
    
    if (userCart.length === 0) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    let subtotal = 0;
    for (const item of items) {
      const unitPrice = parseFloat(item.cartItem.unitPrice || item.product.basePrice);
      subtotal += unitPrice * item.cartItem.quantity;
    }

    const shippingCost = 15.00;
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
      note: `Order for ${session.user.email}`,
    });

    if (paymentResponse.payment?.status === 'COMPLETED') {
      const [newOrder] = await db.insert(orders).values({
        userId: session.user.id,
        status: 'paid',
        subtotal: subtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        shippingAddress: shippingAddress || null,
        billingAddress: billingAddress || null,
        stripePaymentIntentId: paymentResponse.payment.id,
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
          id: paymentResponse.payment.id,
          status: paymentResponse.payment.status,
          receiptUrl: paymentResponse.payment.receiptUrl,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Payment was not completed',
      payment: {
        id: paymentResponse.payment?.id,
        status: paymentResponse.payment?.status,
      },
    }, { status: 400 });
  } catch (error: any) {
    console.error('Square payment error:', error);
    
    const errorMessage = error.errors?.[0]?.detail || error.message || 'Payment failed';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
