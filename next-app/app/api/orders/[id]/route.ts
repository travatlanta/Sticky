import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, products, designs } from '../../../../../shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // TODO: Verify user owns this order when NextAuth is integrated
    
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)));

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Get order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    // Enrich items with product and design data
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let product = null;
        let design = null;

        if (item.productId) {
          const [p] = await db
            .select()
            .from(products)
            .where(eq(products.id, item.productId));
          product = p || null;
        }

        if (item.designId) {
          const [d] = await db
            .select()
            .from(designs)
            .where(eq(designs.id, item.designId));
          design = d || null;
        }

        return { ...item, product, design };
      })
    );

    return NextResponse.json({ ...order, items: enrichedItems });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ message: 'Failed to fetch order' }, { status: 500 });
  }
}
