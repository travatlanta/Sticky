import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../../../lib/db';
import { carts, cartItems, orders, orderItems, products } from '../../../../shared/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderConfirmationEmail';

export const dynamic = 'force-dynamic';

function generateOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'SB-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function noCache(res: NextResponse) {
  res.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  return res;
}

function buildOrderNotes({ 
  expeditedShipping, 
  isWholesaler, 
  wholesaleCertificateUrl, 
  notes 
}: { 
  expeditedShipping?: boolean; 
  isWholesaler?: boolean; 
  wholesaleCertificateUrl?: string; 
  notes?: string; 
}): string | null {
  const parts: string[] = [];
  
  if (expeditedShipping) {
    parts.push('[EXPEDITED SHIPPING]');
  }
  
  if (isWholesaler) {
    parts.push('[WHOLESALER - TAX EXEMPT]');
    if (wholesaleCertificateUrl) {
      parts.push(`Certificate: ${wholesaleCertificateUrl}`);
    }
  }
  
  if (notes) {
    parts.push(notes);
  }
  
  return parts.length > 0 ? parts.join(' - ') : null;
}

export async function POST(req: Request) {
  try {
    const { sourceId, shippingAddress, notes, expeditedShipping, taxAmount = 0, isWholesaler = false, wholesaleCertificateUrl } = await req.json();
    const EXPEDITED_SHIPPING_COST = 25; // Match the frontend constant
    const ARIZONA_TAX_RATE = 0.086; // Arizona state + Phoenix local tax rate

    if (!sourceId) {
      return noCache(
        NextResponse.json({ error: 'Missing payment source' }, { status: 400 })
      );
    }

    // Server-side validation: Wholesalers must provide a certificate URL
    if (isWholesaler && !wholesaleCertificateUrl) {
      return noCache(
        NextResponse.json({ 
          error: 'Tax exemption certificate required. Please upload a valid resale or sales tax exemption certificate to proceed as a wholesaler.' 
        }, { status: 400 })
      );
    }

    // Validate certificate URL format if provided (should be from Vercel Blob)
    if (wholesaleCertificateUrl && !wholesaleCertificateUrl.includes('blob.vercel-storage.com')) {
      return noCache(
        NextResponse.json({ 
          error: 'Invalid certificate URL. Please upload a valid certificate document.' 
        }, { status: 400 })
      );
    }

    // Get current user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const sessionId = (await cookies()).get('cart-session-id')?.value;
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

    // Fetch cart items with product names
    const items = await db
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        productId: cartItems.productId,
        designId: cartItems.designId,
        quantity: cartItems.quantity,
        unitPrice: cartItems.unitPrice,
        selectedOptions: cartItems.selectedOptions,
        mediaType: cartItems.mediaType,
        finishType: cartItems.finishType,
        productName: products.name,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    if (!items.length) {
      return noCache(
        NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      );
    }

    // Subtotal only (no shipping)
    const subtotal = items.reduce((sum, i) => {
      const price = parseFloat(i.unitPrice || '0') || 0;
      return sum + price * i.quantity;
    }, 0);

    console.log('Checkout items:', items.map(i => ({ id: i.id, unitPrice: i.unitPrice, quantity: i.quantity })));
    console.log('Calculated subtotal:', subtotal);

    // Calculate tax based on shipping state (Arizona destinations get taxed)
    // Wholesalers are tax-exempt - skip tax calculation for them
    // We recalculate server-side to ensure accuracy and prevent manipulation
    let calculatedTax = 0;
    if (!isWholesaler && shippingAddress?.state) {
      const state = shippingAddress.state.toUpperCase().trim();
      if (state === 'AZ' || state === 'ARIZONA') {
        calculatedTax = subtotal * ARIZONA_TAX_RATE;
      }
    }
    
    // Calculate full total including expedited shipping and tax
    const expeditedCost = expeditedShipping ? EXPEDITED_SHIPPING_COST : 0;
    const fullTotal = subtotal + expeditedCost + calculatedTax;

    // Allow $0 orders (free products without expedited shipping) - skip payment processing
    if (fullTotal === 0) {
      // Create order directly without payment for free items
      const formattedShippingAddress = shippingAddress ? {
        name: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim(),
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        street: shippingAddress.address1,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.zip,
        country: shippingAddress.country || 'US',
        phone: shippingAddress.phone,
      } : null;

      const [order] = await db
        .insert(orders)
        .values({
          orderNumber: generateOrderNumber(),
          userId: userId,
          status: 'paid',
          subtotal: '0',
          shippingCost: '0',
          taxAmount: '0',
          discountAmount: '0',
          totalAmount: '0',
          shippingAddress: formattedShippingAddress,
          stripePaymentIntentId: `free-order-${randomUUID()}`,
          notes: buildOrderNotes({ expeditedShipping, isWholesaler, wholesaleCertificateUrl, notes }),
        })
        .returning();

      for (const item of items) {
        await db.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          designId: item.designId,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice ?? '0'),
          selectedOptions: item.selectedOptions,
          mediaType: item.mediaType || null,
          finishType: item.finishType || null,
        });
      }

      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

      // Send order confirmation email (free order path)
      if (shippingAddress?.email) {
        try {
          await sendOrderConfirmationEmail({
            toEmail: shippingAddress.email,
            orderNumber: order.orderNumber,
            items: items.map((item) => ({
              name: item.productName || 'Custom Product',
              quantity: item.quantity,
              unitPrice: parseFloat(item.unitPrice || '0'),
            })),
            totals: {
              subtotal: 0,
              shipping: 0,
              tax: 0,
              total: 0,
            },
            shippingAddress: {
              name: formattedShippingAddress?.name || '',
              address1: formattedShippingAddress?.address1 || '',
              address2: formattedShippingAddress?.address2 || undefined,
              city: formattedShippingAddress?.city || '',
              state: formattedShippingAddress?.state || '',
              zip: formattedShippingAddress?.zip || '',
              country: formattedShippingAddress?.country || 'USA',
            },
          });
        } catch (emailError) {
          console.error('Failed to send order confirmation email (free order):', emailError);
        }
      }

      return noCache(NextResponse.json({ success: true, orderId: order.id }));
    }

    if (subtotal < 0 || isNaN(subtotal)) {
      return noCache(
        NextResponse.json({ 
          error: 'Invalid cart total. Please ensure all items have valid prices.',
          debug: { itemCount: items.length, subtotal }
        }, { status: 400 })
      );
    }

    // Construct payload for Square API (fullTotal already includes expedited shipping)
    const amountInCents = Math.round(fullTotal * 100);
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

    // Format shipping address for storage
    const formattedShippingAddress = shippingAddress ? {
      name: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim(),
      firstName: shippingAddress.firstName,
      lastName: shippingAddress.lastName,
      street: shippingAddress.address1,
      address1: shippingAddress.address1,
      address2: shippingAddress.address2,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zip: shippingAddress.zip,
      country: shippingAddress.country || 'US',
      phone: shippingAddress.phone,
    } : null;

    // Create order with all data (expeditedCost, calculatedTax, and fullTotal already calculated at top)
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber: generateOrderNumber(),
        userId: userId,
        status: 'paid',
        subtotal: subtotal.toString(),
        shippingCost: expeditedCost.toString(),
        taxAmount: calculatedTax.toFixed(2),
        discountAmount: '0',
        totalAmount: fullTotal.toString(),
        shippingAddress: formattedShippingAddress,
        stripePaymentIntentId: payment.id,
        notes: buildOrderNotes({ expeditedShipping, isWholesaler, wholesaleCertificateUrl, notes }),
      })
      .returning();

    // Create order items with design links
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        designId: item.designId,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice ?? '0'),
        selectedOptions: item.selectedOptions,
        mediaType: item.mediaType || null,
        finishType: item.finishType || null,
      });
    }

    // Clear cart
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    // Send order confirmation email (paid order path)
    if (shippingAddress?.email) {
      try {
        await sendOrderConfirmationEmail({
          toEmail: shippingAddress.email,
          orderNumber: order.orderNumber,
          items: items.map((item) => ({
            name: item.productName || 'Custom Product',
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice || '0'),
          })),
          totals: {
            subtotal: subtotal,
            shipping: expeditedCost,
            tax: calculatedTax,
            total: fullTotal,
          },
          shippingAddress: {
            name: formattedShippingAddress?.name || '',
            address1: formattedShippingAddress?.address1 || '',
            address2: formattedShippingAddress?.address2 || undefined,
            city: formattedShippingAddress?.city || '',
            state: formattedShippingAddress?.state || '',
            zip: formattedShippingAddress?.zip || '',
            country: formattedShippingAddress?.country || 'USA',
          },
        });
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
      }
    }

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
