export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, orders } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
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

    let allUsers: any[] = [];
    try {
      allUsers = await db.select().from(users);
    } catch (err) {
      console.error('Error fetching users from database:', err);
      return NextResponse.json([]);
    }

    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        let orderCount = 0;
        let totalSpent = 0;
        
        try {
          const userOrders = await db
            .select()
            .from(orders)
            .where(eq(orders.userId, user.id));

          orderCount = userOrders.length;
          totalSpent = userOrders.reduce((sum, order) => {
            return sum + parseFloat(order.totalAmount || '0');
          }, 0);
        } catch (orderErr) {
          // If orders query fails (schema mismatch), just use defaults
          console.error('Error fetching orders for user:', orderErr);
        }

        return {
          ...user,
          password: undefined,
          orderCount,
          totalSpent,
          hasOrders: orderCount > 0,
        };
      })
    );

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
  }
}
