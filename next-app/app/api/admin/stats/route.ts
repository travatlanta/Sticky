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
    
    let allUsers: any[] = [];
    let allOrders: any[] = [];
    let allProducts: any[] = [];
    let allCategories: any[] = [];
    
    try {
      allUsers = await db.select().from(users);
    } catch (err) {
      console.warn('Failed to fetch users:', err);
    }
    
    try {
      allOrders = await db.select().from(orders);
    } catch (err) {
      console.warn('Failed to fetch orders:', err);
    }
    
    try {
      allProducts = await db.select().from(products);
    } catch (err) {
      console.warn('Failed to fetch products:', err);
    }
    
    try {
      allCategories = await db.select().from(categories);
    } catch (err) {
      console.warn('Failed to fetch categories:', err);
    }

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
    // Return default values instead of 500 error
    return NextResponse.json({
      userCount: 0,
      orderCount: 0,
      productCount: 0,
      categoryCount: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      completedOrders: 0,
    });
  }
}
