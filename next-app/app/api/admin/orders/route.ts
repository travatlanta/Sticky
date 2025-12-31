export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, users, orderItems, products, designs, productOptions } from '@shared/schema';
import { desc, eq, inArray } from 'drizzle-orm';
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
            let resolvedOptions: Record<string, string> = {};

            if (item.productId) {
              const [p] = await db.select().from(products).where(eq(products.id, item.productId));
              product = p || null;
            }

            if (item.designId) {
              const [d] = await db.select().from(designs).where(eq(designs.id, item.designId));
              design = d || null;
            }

            // Resolve selectedOptions IDs to human-readable names
            if (item.selectedOptions && typeof item.selectedOptions === 'object') {
              const optionIds = Object.values(item.selectedOptions as Record<string, number>).filter(
                (v): v is number => typeof v === 'number'
              );
              
              if (optionIds.length > 0) {
                const options = await db
                  .select({ id: productOptions.id, optionType: productOptions.optionType, name: productOptions.name })
                  .from(productOptions)
                  .where(inArray(productOptions.id, optionIds));
                
                const optionMap = new Map(options.map(o => [o.id, o]));
                
                for (const [key, optionId] of Object.entries(item.selectedOptions as Record<string, number>)) {
                  const option = optionMap.get(optionId);
                  if (option) {
                    // Use the optionType as key for cleaner display
                    const displayKey = option.optionType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    resolvedOptions[displayKey] = option.name;
                  } else {
                    resolvedOptions[key] = String(optionId);
                  }
                }
              }
            }

            return { ...item, product, design, resolvedOptions };
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
