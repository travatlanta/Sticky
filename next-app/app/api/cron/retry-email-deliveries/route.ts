export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailDeliveries, orders, orderItems, products, users } from '@shared/schema';
import { and, eq, lt, or } from 'drizzle-orm';
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderConfirmationEmail';

function isAuthorized(req: Request): boolean {
  // Vercel Cron Jobs (configured via vercel.json) include this header.
  // Note: any client can technically spoof headers, so keep this route idempotent.
  const xVercelCron = req.headers.get('x-vercel-cron');
  const isVercelCron = xVercelCron === '1' || xVercelCron === 'true';
  if (isVercelCron) return true;

  const expected = process.env.CRON_SECRET;
  // If no secret is configured, allow (useful for local/dev).
  if (!expected) return true;

  const authHeader = req.headers.get('authorization') || '';
  const cronSecret = req.headers.get('x-cron-secret') || '';
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : '';

  return bearerToken === expected || cronSecret === expected;
}

function isQueueEnabled(): boolean {
  return process.env.EMAIL_DELIVERY_QUEUE_ENABLED === 'true';
}

function backoffMs(attempts: number): number {
  // 1m, 2m, 4m, 8m... capped at 60m
  const base = 60_000;
  const cap = 60 * 60_000;
  const exp = Math.pow(2, Math.max(attempts - 1, 0));
  return Math.min(cap, base * exp);
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!isQueueEnabled()) {
      // Feature-flagged off by default.
      return NextResponse.json({ disabled: true, message: 'EMAIL_DELIVERY_QUEUE_ENABLED is false' }, { status: 200 });
    }

    const MAX_ATTEMPTS = 10;
    const BATCH_SIZE = 20;

    // Fetch a batch of deliveries that are not sent and still retryable.
    const deliveries = await db
      .select()
      .from(emailDeliveries)
      .where(
        and(
          or(eq(emailDeliveries.status, 'failed'), eq(emailDeliveries.status, 'pending')),
          lt(emailDeliveries.attempts, MAX_ATTEMPTS)
        )
      )
      .limit(BATCH_SIZE);

    const now = Date.now();

    let scanned = 0;
    let skippedBackoff = 0;
    let attempted = 0;
    let sent = 0;
    let failed = 0;

    for (const delivery of deliveries) {
      scanned += 1;

      const attempts = delivery.attempts ?? 0;
      const lastAttemptAt = delivery.lastAttemptAt ? new Date(delivery.lastAttemptAt as any).getTime() : 0;
      const dueInMs = backoffMs(attempts);

      if (lastAttemptAt && now - lastAttemptAt < dueInMs) {
        skippedBackoff += 1;
        continue;
      }

      // Load order + items so we can re-render the same email.
      const [orderRow] = await db
        .select({
          order: orders,
          userEmail: users.email,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(eq(orders.id, delivery.orderId));

      const order = orderRow?.order;
      if (!order) {
        // Nothing to send. Mark as failed and stop retrying.
        await db
          .update(emailDeliveries)
          .set({
            status: 'failed',
            lastError: 'Order not found for email delivery',
            attempts: MAX_ATTEMPTS,
            lastAttemptAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(emailDeliveries.id, delivery.id));

        failed += 1;
        continue;
      }

      const shippingAddr = (order.shippingAddress as any) || {};

      const items = await db
        .select({
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          productName: products.name,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

      attempted += 1;

      const result = await sendOrderConfirmationEmail({
        orderId: order.id,
        toEmail: delivery.toEmail,
        orderNumber: order.orderNumber || `#${order.id}`,
        items: items.map((item) => ({
          name: item.productName || 'Custom Product',
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice || '0'),
        })),
        totals: {
          subtotal: parseFloat(order.subtotal || '0'),
          shipping: parseFloat(order.shippingCost || '0'),
          tax: parseFloat(order.taxAmount || '0'),
          total: parseFloat(order.totalAmount || '0'),
        },
        shippingAddress: {
          name: shippingAddr?.name || `${shippingAddr?.firstName || ''} ${shippingAddr?.lastName || ''}`.trim(),
          address1: shippingAddr?.address1 || shippingAddr?.street || '',
          address2: shippingAddr?.address2 || undefined,
          city: shippingAddr?.city || '',
          state: shippingAddr?.state || '',
          zip: shippingAddr?.zip || '',
          country: shippingAddr?.country || 'USA',
        },
      });

      if (result.ok) {
        sent += 1;
      } else {
        failed += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      scanned,
      skippedBackoff,
      attempted,
      sent,
      failed,
    });
  } catch (error) {
    console.error('retry-email-deliveries cron error:', error);
    return NextResponse.json({ ok: false, message: 'Cron failed' }, { status: 500 });
  }
}
