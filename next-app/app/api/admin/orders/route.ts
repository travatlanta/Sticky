export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, users, orderItems, products, designs } from '@shared/schema';
import { desc, eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    // Enrich each order with user info and items
    const enrichedOrders = await Promise.all(
      allOrders.map(async (order) => {
        let user = null;
        if (order.userId) {
          const [u] = await db.select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            phone: users.phone,
          }).from(users).where(eq(users.id, order.userId));
          user = u || null;
        }

        // Get order items with product info
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        const enrichedItems = await Promise.all(
          items.map(async (item) => {
            let product = null;
            let design = null;

            if (item.productId) {
              const [p] = await db.select().from(products).where(eq(products.id, item.productId));
              product = p || null;
            }

            if (item.designId) {
              const [d] = await db.select().from(designs).where(eq(designs.id, item.designId));
              design = d || null;
            }

            return { ...item, product, design };
          })
        );

        return { ...order, user, items: enrichedItems };
      })
    );

    return NextResponse.json(enrichedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ message: 'Failed to fetch orders' }, { status: 500 });
  }
}
