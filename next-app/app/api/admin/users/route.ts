import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, orders } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const allUsers = await db.select().from(users);

    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        const userOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.userId, user.id));

        const orderCount = userOrders.length;
        const totalSpent = userOrders.reduce((sum, order) => {
          return sum + parseFloat(order.totalAmount || '0');
        }, 0);

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
