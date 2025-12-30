export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, products, designs, users, productOptions } from '@shared/schema';
import { eq, inArray } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)));

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Get user info
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

        // Resolve option IDs to names
        if (item.selectedOptions && typeof item.selectedOptions === 'object') {
          const optionIds: number[] = [];
          for (const [key, value] of Object.entries(item.selectedOptions as Record<string, any>)) {
            if (typeof value === 'number') {
              optionIds.push(value);
            }
          }
          
          if (optionIds.length > 0) {
            const options = await db
              .select({ id: productOptions.id, name: productOptions.name, optionType: productOptions.optionType })
              .from(productOptions)
              .where(inArray(productOptions.id, optionIds));
            
            for (const [key, value] of Object.entries(item.selectedOptions as Record<string, any>)) {
              if (typeof value === 'number') {
                const option = options.find(o => o.id === value);
                resolvedOptions[key] = option?.name || `Option #${value}`;
              } else {
                resolvedOptions[key] = String(value);
              }
            }
          } else {
            // No numeric IDs, just use the values as-is
            for (const [key, value] of Object.entries(item.selectedOptions as Record<string, any>)) {
              resolvedOptions[key] = String(value);
            }
          }
        }

        return { ...item, product, design, resolvedOptions };
      })
    );

    return NextResponse.json({ ...order, user, items: enrichedItems });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ message: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const [order] = await db
      .update(orders)
      .set({
        status: body.status,
        shippingAddress: body.shippingAddress,
        trackingNumber: body.trackingNumber,
        notes: body.notes,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, parseInt(id)))
      .returning();

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ message: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    // First delete order items
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));

    // Then delete the order
    await db.delete(orders).where(eq(orders.id, orderId));

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ message: 'Failed to delete order' }, { status: 500 });
  }
}
