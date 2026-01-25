export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, users, orderItems, products, designs, productOptions, emailDeliveries } from '@shared/schema';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Parse customer info from notes field (for orders created without customerEmail/customerName columns)
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    let allOrders: any[] = [];
    try {
      // Use raw SQL to only select columns that exist in production
      // Check for artwork_status column and include if available
      const result = await db.execute(sql`
        SELECT id, order_number, user_id, status, subtotal, shipping_cost, 
               tax_amount, discount_amount, total_amount, shipping_address, 
               notes, tracking_number, created_at, artwork_status
        FROM orders 
        ORDER BY created_at DESC
      `);
      
      allOrders = (result.rows || []).map((row: any) => ({
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
        notes: row.notes,
        trackingNumber: row.tracking_number,
        createdAt: row.created_at,
        artworkStatus: row.artwork_status || null,
        // Parse customer info from notes for display
        ...parseNotesForCustomerInfo(row.notes),
      }));
    } catch (ordersErr) {
      console.error('Error fetching orders (schema mismatch?):', ordersErr);
      // Return empty array if orders table has schema issues
      return NextResponse.json([]);
    }

    // Prefetch email deliveries for these orders (best-effort: the table may not exist yet)
    const deliveriesByOrderId = new Map<number, (typeof emailDeliveries.$inferSelect)[]>();

    try {
      const orderIds = allOrders.map((o) => o.id);
      if (orderIds.length > 0) {
        const deliveries = await db
          .select()
          .from(emailDeliveries)
          .where(inArray(emailDeliveries.orderId, orderIds))
          .orderBy(desc(emailDeliveries.createdAt));

        for (const d of deliveries) {
          const existing = deliveriesByOrderId.get(d.orderId) ?? [];
          existing.push(d);
          deliveriesByOrderId.set(d.orderId, existing);
        }
      }
    } catch (err) {
      console.warn(
        "[admin/orders] Skipping email deliveries lookup (table missing or query failed):",
        err
      );
    }


    // Enrich each order with user info and items
    const enrichedOrders = await Promise.all(
      allOrders.map(async (order) => {
        try {
          let user = null;
          if (order.userId) {
            try {
              const [u] = await db.select({
                id: users.id,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                phone: users.phone,
              }).from(users).where(eq(users.id, order.userId));
              user = u || null;
            } catch (userErr) {
              console.warn(`Failed to fetch user for order ${order.id}:`, userErr);
            }
          }

          // Get order items with product info
          let items: any[] = [];
          try {
            items = await db
              .select()
              .from(orderItems)
              .where(eq(orderItems.orderId, order.id));
          } catch (itemsErr) {
            console.warn(`Failed to fetch items for order ${order.id}:`, itemsErr);
          }

          const enrichedItems = await Promise.all(
            items.map(async (item) => {
              let product = null;
              let design = null;
              let resolvedOptions: Record<string, string> = {};

              try {
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
              } catch (enrichErr) {
                console.warn(`Failed to enrich item ${item.id}:`, enrichErr);
              }

              return { ...item, product, design, resolvedOptions };
            })
          );

          const deliveries = deliveriesByOrderId.get(order.id) ?? [];

          return { ...order, user, items: enrichedItems, deliveries };
        } catch (orderErr) {
          console.warn(`Failed to enrich order ${order.id}:`, orderErr);
          return { ...order, user: null, items: [], deliveries: [] };
        }
      })
    );

    return NextResponse.json(enrichedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ message: 'Failed to fetch orders' }, { status: 500 });
  }
}
