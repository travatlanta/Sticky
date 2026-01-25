export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@shared/schema';
import { desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    let allOrders: any[] = [];
    try {
      allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    } catch (err) {
      console.error('Error fetching orders from database:', err);
      // Return default empty finance data
      return NextResponse.json({
        totalRevenue: 0,
        orderCount: 0,
        averageOrderValue: 0,
        revenueByStatus: { paid: 0, pending: 0, delivered: 0, cancelled: 0 },
        recentOrders: [],
      });
    }

    const totalRevenue = allOrders.reduce((sum, order) => {
      return sum + parseFloat(order.totalAmount || '0');
    }, 0);

    const orderCount = allOrders.length;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    const revenueByStatus = {
      paid: 0,
      pending: 0,
      delivered: 0,
      cancelled: 0,
    };

    allOrders.forEach((order) => {
      const amount = parseFloat(order.totalAmount || '0');
      const status = order.status as keyof typeof revenueByStatus;
      if (status in revenueByStatus) {
        revenueByStatus[status] += amount;
      }
    });

    const recentOrders = allOrders.slice(0, 10);

    return NextResponse.json({
      totalRevenue,
      orderCount,
      averageOrderValue,
      revenueByStatus,
      recentOrders,
    });
  } catch (error) {
    console.error('Error fetching finance data:', error);
    return NextResponse.json({ message: 'Failed to fetch finance data' }, { status: 500 });
  }
}
