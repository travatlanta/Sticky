export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orderItems, products, designs, users, productOptions, emailDeliveries } from '@shared/schema';
import { eq, inArray, desc, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Parse customer info from notes field
function parseNotesForCustomerInfo(notes: string | null): { name?: string; email?: string; phone?: string } {
  if (!notes) return {};
  const result: { name?: string; email?: string; phone?: string } = {};
  
  const nameMatch = notes.match(/Customer:\s*(.+?)(?:\n|$)/);
  if (nameMatch) result.name = nameMatch[1].trim();
  
  const emailMatch = notes.match(/Email:\s*(.+?)(?:\n|$)/);
  if (emailMatch) result.email = emailMatch[1].trim();
  
  const phoneMatch = notes.match(/Phone:\s*(.+?)(?:\n|$)/);
  if (phoneMatch) result.phone = phoneMatch[1].trim();
  
  return result;
}

// Clean notes to hide payment link from display
function cleanNotesForDisplay(notes: string | null): string {
  if (!notes) return '';
  return notes.replace(/Payment Link:\s*[a-f0-9]+/gi, '').trim();
}

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
    
    // Use raw SQL to avoid schema conflicts
    const result = await db.execute(sql`
      SELECT id, order_number, user_id, status, subtotal, shipping_cost, 
             tax_amount, discount_amount, total_amount, shipping_address, 
             notes, tracking_number, created_at
      FROM orders 
      WHERE id = ${parseInt(id)}
    `);

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const row = result.rows[0] as any;
    const customerInfo = parseNotesForCustomerInfo(row.notes);
    
    const order = {
      id: row.id,
      orderNumber: row.order_number,
      userId: row.user_id,
      status: row.status,
      subtotal: row.subtotal,
      shippingCost: row.shipping_cost,
      taxAmount: row.tax_amount,
      discountAmount: row.discount_amount,
      totalAmount: row.total_amount,
      shippingAddress: row.shipping_address,
      notes: cleanNotesForDisplay(row.notes),
      trackingNumber: row.tracking_number,
      createdAt: row.created_at,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
    };

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

    let deliveries: any[] = [];
    try {
      deliveries = await db
        .select()
        .from(emailDeliveries)
        .where(eq(emailDeliveries.orderId, order.id))
        .orderBy(desc(emailDeliveries.createdAt));
    } catch (e) {
      // Best-effort: if the email_deliveries table/enum isn't present yet, don't break the admin order view
      deliveries = [];
    }

    return NextResponse.json({ ...order, user, items: enrichedItems, deliveries });
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
    const orderId = parseInt(id);
    const body = await request.json();

    // Build dynamic update using raw SQL
    const shippingAddressJson = body.shippingAddress ? JSON.stringify(body.shippingAddress) : null;
    
    await db.execute(sql`
      UPDATE orders SET
        status = COALESCE(${body.status}, status),
        shipping_address = COALESCE(${shippingAddressJson}::jsonb, shipping_address),
        tracking_number = COALESCE(${body.trackingNumber || null}, tracking_number),
        notes = COALESCE(${body.notes || null}, notes)
      WHERE id = ${orderId}
    `);

    // Fetch the updated order
    const result = await db.execute(sql`
      SELECT id, order_number, user_id, status, subtotal, shipping_cost, 
             tax_amount, discount_amount, total_amount, shipping_address, 
             notes, tracking_number, created_at
      FROM orders 
      WHERE id = ${orderId}
    `);

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const row = result.rows[0] as any;
    const customerInfo = parseNotesForCustomerInfo(row.notes);
    
    return NextResponse.json({
      id: row.id,
      orderNumber: row.order_number,
      userId: row.user_id,
      status: row.status,
      subtotal: row.subtotal,
      shippingCost: row.shipping_cost,
      taxAmount: row.tax_amount,
      discountAmount: row.discount_amount,
      totalAmount: row.total_amount,
      shippingAddress: row.shipping_address,
      notes: cleanNotesForDisplay(row.notes),
      trackingNumber: row.tracking_number,
      createdAt: row.created_at,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
    });
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

    // Delete all related records with foreign keys to orders
    // Order matters due to FK constraints
    
    // Delete messages referencing this order
    try {
      await db.execute(sql`DELETE FROM messages WHERE order_id = ${orderId}`);
    } catch (e) {
      // Table might not exist, continue
    }

    // Delete notifications referencing this order
    try {
      await db.execute(sql`DELETE FROM notifications WHERE order_id = ${orderId}`);
    } catch (e) {
      // Table might not exist, continue
    }

    // Delete order items
    await db.execute(sql`DELETE FROM order_items WHERE order_id = ${orderId}`);

    // Delete any related email delivery logs
    try {
      await db.execute(sql`DELETE FROM email_deliveries WHERE order_id = ${orderId}`);
    } catch (e) {
      // Table might not exist, continue
    }

    // Finally delete the order
    await db.execute(sql`DELETE FROM orders WHERE id = ${orderId}`);

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ message: 'Failed to delete order' }, { status: 500 });
  }
}
