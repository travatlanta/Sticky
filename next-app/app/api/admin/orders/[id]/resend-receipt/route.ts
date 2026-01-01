export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, products } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendOrderConfirmationEmail } from '@/lib/email/sendOrderConfirmationEmail';

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

    // Get the order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Get customer email from shipping address
    const shippingAddr = order.shippingAddress as any;
    const customerEmail = shippingAddr?.email;

    if (!customerEmail) {
      return NextResponse.json({ 
        message: 'No email address found for this order. The customer did not provide an email during checkout.' 
      }, { status: 400 });
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

    // Send the email
    const result = await sendOrderConfirmationEmail({
      toEmail: customerEmail,
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
      return NextResponse.json({ 
        message: result.error || 'Failed to send email' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Receipt sent to ${customerEmail}` 
    });
  } catch (error) {
    console.error('Error resending receipt:', error);
    return NextResponse.json({ message: 'Failed to resend receipt' }, { status: 500 });
  }
}
