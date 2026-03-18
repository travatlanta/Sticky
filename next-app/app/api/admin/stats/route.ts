export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from 'drizzle-orm';

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
    
    // Use raw SQL with only core columns to avoid schema mismatch issues
    let userCount = 0;
    let orderCount = 0;
    let revenue = 0;
    let productCount = 0;
    let categoryCount = 0;
    let pendingOrders = 0;
    let completedOrders = 0;

    try {
      const usersResult = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      userCount = parseInt((usersResult.rows[0] as any)?.count || '0');
    } catch (err) {
      console.warn('Failed to count users:', err);
    }

    try {
      const ordersResult = await db.execute(sql`
        SELECT 
          COUNT(*) as count,
          COALESCE(SUM(CAST(total_amount AS numeric)), 0) as total_revenue,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'delivered') as completed
        FROM orders
      `);
      const row = ordersResult.rows[0] as any;
      orderCount = parseInt(row?.count || '0');
      revenue = parseFloat(row?.total_revenue || '0');
      pendingOrders = parseInt(row?.pending || '0');
      completedOrders = parseInt(row?.completed || '0');
    } catch (err) {
      console.warn('Failed to count orders:', err);
    }

    try {
      const productsResult = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
      productCount = parseInt((productsResult.rows[0] as any)?.count || '0');
    } catch (err) {
      console.warn('Failed to count products:', err);
    }

    try {
      const categoriesResult = await db.execute(sql`SELECT COUNT(*) as count FROM categories`);
      categoryCount = parseInt((categoriesResult.rows[0] as any)?.count || '0');
    } catch (err) {
      console.warn('Failed to count categories:', err);
    }

    return NextResponse.json({
      userCount,
      orderCount,
      productCount,
      categoryCount,
      revenue,
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
      revenue: 0,
      pendingOrders: 0,
      completedOrders: 0,
    });
  }
}
