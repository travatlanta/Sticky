export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, products, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderConfirmationEmail';

function isValidEmail(email: string): boolean {
  // Simple sanity check. We don't need RFC-perfect validation here.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    const body = await request.json().catch(() => ({} as any));
    const toEmailOverride =
      typeof body?.toEmail === 'string' && body.toEmail.trim() ? body.toEmail.trim() : null;

    if (toEmailOverride && !isValidEmail(toEmailOverride)) {
      return NextResponse.json({ message: 'Invalid override email address' }, { status: 400 });
    }

    // Get the order + optional user email
    const [row] = await db
      .select({
        order: orders,
        userEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, orderId));

    const order = row?.order;
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const userEmail =
      typeof row?.userEmail === 'string' && row.userEmail.trim() ? row.userEmail.trim() : null;

    const shippingAddr = (order.shippingAddress as any) || {};
    const legacyEmail =
      typeof shippingAddr?.email === 'string' && shippingAddr.email.trim()
        ? shippingAddr.email.trim()
        : null;

    const resolvedEmail =
      (toEmailOverride && toEmailOverride.trim()) ||
      (typeof (order as any).customerEmail === 'string' && (order as any).customerEmail.trim()
        ? (order as any).customerEmail.trim()
        : null) ||
      legacyEmail ||
      userEmail;

    if (!resolvedEmail) {
      return NextResponse.json(
        {
          message:
            'No email address found for this order. Provide an override email by POSTing JSON: { "toEmail": "customer@example.com" }',
        },
        { status: 400 }
      );
    }

    // Get order items with product names
    const items = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        productName: products.name,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    // Send the email (forceSend=true so admin resends always send)
    const result = await sendOrderConfirmationEmail({
      orderId: order.id,
      forceSend: true,
      toEmail: resolvedEmail,
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

    if (!result.ok) {
      return NextResponse.json({ message: result.error || 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Receipt sent to ${resolvedEmail}`,
    });
  } catch (error) {
    console.error('Error resending receipt:', error);
    return NextResponse.json({ message: 'Failed to resend receipt' }, { status: 500 });
  }
}
