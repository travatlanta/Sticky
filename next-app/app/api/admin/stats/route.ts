export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, orders, products, categories } from '@shared/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (authError) {
      console.error('Auth error in admin/stats:', authError);
      return NextResponse.json({ message: 'Authentication error' }, { status: 500 });
    }
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const allUsers = await db.select().from(users);
    const allOrders = await db.select().from(orders);
    const allProducts = await db.select().from(products);
    const allCategories = await db.select().from(categories);

    const totalRevenue = allOrders.reduce((sum, order) => {
      return sum + parseFloat(order.totalAmount || '0');
    }, 0);

    const pendingOrders = allOrders.filter((o) => o.status === 'pending').length;
    const completedOrders = allOrders.filter((o) => o.status === 'delivered').length;

    return NextResponse.json({
      userCount: allUsers.length,
      orderCount: allOrders.length,
      productCount: allProducts.length,
      categoryCount: allCategories.length,
      totalRevenue,
      pendingOrders,
      completedOrders,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ message: 'Failed to fetch stats', error: String(error) }, { status: 500 });
  }
}
