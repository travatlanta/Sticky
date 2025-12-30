export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, products, orders, categories } from '@shared/schema';

export async function GET() {
  const deployTime = new Date().toISOString();
  const codeVersion = 'v4-dec30-db-test';
  
  try {
    console.log('Debug auth: Starting');
    const session = await getServerSession(authOptions);
    console.log('Debug auth: Session obtained');
    
    // Test database queries
    let dbTest = { success: false, error: null as string | null, counts: {} as Record<string, number> };
    try {
      console.log('Debug: Testing database queries');
      const allUsers = await db.select().from(users);
      const allProducts = await db.select().from(products);
      const allOrders = await db.select().from(orders);
      const allCategories = await db.select().from(categories);
      dbTest = {
        success: true,
        error: null,
        counts: {
          users: allUsers.length,
          products: allProducts.length,
          orders: allOrders.length,
          categories: allCategories.length,
        }
      };
      console.log('Debug: Database queries successful');
    } catch (dbError) {
      console.error('Debug: Database error:', dbError);
      dbTest = {
        success: false,
        error: dbError instanceof Error ? dbError.message : String(dbError),
        counts: {}
      };
    }
    
    return NextResponse.json({
      codeVersion,
      deployTime,
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email || null,
      userId: (session?.user as any)?.id || null,
      isAdmin: (session?.user as any)?.isAdmin || false,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : [],
      dbTest,
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({
      codeVersion,
      deployTime,
      error: true,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
