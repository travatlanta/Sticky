export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, orders } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const userId = params.id;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    let userOrders: any[] = [];
    let orderStats = {
      totalOrders: 0,
      totalSpent: 0,
      pendingOrders: 0,
      completedOrders: 0,
    };

    try {
      let result;
      try {
        result = await db.execute(sql`
          SELECT 
            id, order_number, status, subtotal, shipping_cost, 
            tax_amount, discount_amount, total_amount, shipping_address, 
            notes, tracking_number, created_at, delivery_method,
            customer_email, customer_name
          FROM orders 
          WHERE user_id = ${userId}
             OR LOWER(customer_email) = ${user.email?.toLowerCase() || ''}
          ORDER BY created_at DESC
        `);
      } catch (colErr) {
        console.log('Falling back to minimal order columns');
        result = await db.execute(sql`
          SELECT 
            id, order_number, status, subtotal, shipping_cost, 
            tax_amount, discount_amount, total_amount, shipping_address, 
            notes, tracking_number, created_at
          FROM orders 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `);
      }

      userOrders = (result.rows || []).map((row: any) => ({
        id: row.id,
        orderNumber: row.order_number,
        status: row.status,
        subtotal: row.subtotal,
        shippingCost: row.shipping_cost,
        taxAmount: row.tax_amount,
        discountAmount: row.discount_amount,
        totalAmount: row.total_amount,
        shippingAddress: row.shipping_address,
        notes: row.notes,
        trackingNumber: row.tracking_number,
        createdAt: row.created_at,
        deliveryMethod: row.delivery_method || null,
        customerEmail: row.customer_email || null,
        customerName: row.customer_name || null,
      }));

      orderStats.totalOrders = userOrders.length;
      orderStats.totalSpent = userOrders.reduce((sum, order) => {
        return sum + parseFloat(order.totalAmount || '0');
      }, 0);
      orderStats.pendingOrders = userOrders.filter(o => 
        ['pending', 'pending_payment', 'paid', 'in_production'].includes(o.status)
      ).length;
      orderStats.completedOrders = userOrders.filter(o => 
        ['shipped', 'delivered'].includes(o.status)
      ).length;
    } catch (orderErr) {
      console.error('Error fetching orders for user:', orderErr);
    }

    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      profileImageUrl: user.profileImageUrl,
      orders: userOrders,
      stats: orderStats,
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json({ message: 'Failed to fetch user details' }, { status: 500 });
  }
}
