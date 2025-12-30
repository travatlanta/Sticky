export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, orders, products, categories } from '@shared/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    console.log('Admin stats: Starting request');
    const session = await getServerSession(authOptions);
    console.log('Admin stats: Session:', session ? 'exists' : 'null', 'user:', session?.user?.email);
    
    if (!session?.user) {
      console.log('Admin stats: No session user');
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('Admin stats: isAdmin check:', (session.user as any).isAdmin);
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    console.log('Admin stats: Fetching data from database');
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json({ 
      message: 'Failed to fetch stats', 
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined 
    }, { status: 500 });
  }
}
