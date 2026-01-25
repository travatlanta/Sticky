export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orderItems, products, designs, users, productOptions, emailDeliveries } from '@shared/schema';
import { eq, inArray, desc, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateEmailHtml } from '@/lib/email/template';
import { Resend } from 'resend';

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
             notes, tracking_number, created_at, created_by_admin_id
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
      createdByAdminId: row.created_by_admin_id,
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

    // Fetch admin design for this order from order_designs table
    let adminDesign = null;
    let artworkStatus = 'awaiting_artwork';
    try {
      const designResult = await db.execute(sql`
        SELECT od.id as link_id, od.status, od.notes as design_notes,
               d.id, d.name, d.preview_url as "thumbnailUrl"
        FROM order_designs od
        JOIN designs d ON d.id = od.design_id
        WHERE od.order_id = ${order.id}
        ORDER BY od.created_at DESC
        LIMIT 1
      `);
      if (designResult.rows?.[0]) {
        const row = designResult.rows[0] as any;
        adminDesign = {
          id: row.id,
          name: row.name,
          thumbnailUrl: row.thumbnailUrl,
        };
        artworkStatus = row.status || 'pending_approval';
      }
    } catch (e) {
      // Table might not exist yet - ignore
    }

    return NextResponse.json({ ...order, user, items: enrichedItems, deliveries, adminDesign, artworkStatus });
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

    // Fetch current order to check if tracking number is being added
    const currentOrderResult = await db.execute(sql`
      SELECT order_number, tracking_number, notes, shipping_address
      FROM orders WHERE id = ${orderId}
    `);
    const currentOrder = currentOrderResult.rows?.[0] as any;
    const isAddingTracking = body.trackingNumber && !currentOrder?.tracking_number;

    // Auto-set status to 'shipped' when tracking number is added
    const effectiveStatus = isAddingTracking ? 'shipped' : body.status;

    // Build dynamic update using raw SQL
    const shippingAddressJson = body.shippingAddress ? JSON.stringify(body.shippingAddress) : null;
    
    await db.execute(sql`
      UPDATE orders SET
        status = COALESCE(${effectiveStatus}, status),
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

    // Send shipping notification email when tracking is added
    if (isAddingTracking && customerInfo.email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const orderNumber = row.order_number;
        const trackingNumber = body.trackingNumber;
        const shippingAddress = row.shipping_address || currentOrder?.shipping_address;
        
        // Determine carrier from tracking number format
        let carrier = 'Your Carrier';
        let trackingUrl = '';
        if (/^1Z/i.test(trackingNumber)) {
          carrier = 'UPS';
          trackingUrl = `https://www.ups.com/track?tracknum=${trackingNumber}`;
        } else if (/^\d{20,22}$/.test(trackingNumber)) {
          carrier = 'USPS';
          trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
        } else if (/^\d{12,15}$/.test(trackingNumber)) {
          carrier = 'FedEx';
          trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_URL || 'https://stickybanditos.com';

        const emailHtml = generateEmailHtml({
          preheaderText: `Great news! Your order #${orderNumber} has shipped!`,
          headline: 'Your Order Has Shipped! 📦',
          subheadline: `Order #${orderNumber}`,
          greeting: `Hi ${customerInfo.name || 'Valued Customer'},`,
          bodyContent: `
            <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
              Great news! Your stickers are on the way! Your order has been shipped and is heading to you.
            </p>
            
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #bbf7d0;">
              <h3 style="margin: 0 0 16px 0; color: #166534; font-size: 18px; font-weight: bold;">Tracking Information</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Carrier:</td>
                  <td style="padding: 8px 0; color: #1f2937; text-align: right;">${carrier}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #374151; font-weight: 500;">Tracking Number:</td>
                  <td style="padding: 8px 0; color: #1f2937; text-align: right; font-family: monospace;">${trackingNumber}</td>
                </tr>
              </table>
              ${trackingUrl ? `
              <div style="margin-top: 16px; text-align: center;">
                <a href="${trackingUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Track Your Package
                </a>
              </div>
              ` : ''}
            </div>

            ${shippingAddress ? `
            <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">Shipping To:</h3>
              <p style="margin: 0; color: #6b7280; line-height: 1.5;">
                ${shippingAddress.name || customerInfo.name || ''}<br>
                ${shippingAddress.address1 || shippingAddress.street || ''}<br>
                ${shippingAddress.address2 ? shippingAddress.address2 + '<br>' : ''}
                ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zip || shippingAddress.zipCode || ''}<br>
                ${shippingAddress.country || 'USA'}
              </p>
            </div>
            ` : ''}

            <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
              <strong>Estimated Delivery:</strong> 3-7 business days (depending on your location and shipping method)
            </p>
          `,
          ctaButton: {
            text: 'View Order Details',
            url: `${baseUrl}/orders/${orderId}`,
            color: 'orange',
          },
          showSocialLinks: true,
          customFooterNote: 'Thank you for choosing Sticky Banditos! We appreciate your business.',
        });

        await resend.emails.send({
          from: 'Sticky Banditos <orders@stickybanditos.com>',
          to: customerInfo.email,
          subject: `Your Order #${orderNumber} Has Shipped! 📦`,
          html: emailHtml,
        });

        console.log(`Shipping notification sent to ${customerInfo.email} for order ${orderNumber}`);
      } catch (emailError) {
        console.error('Error sending shipping notification email:', emailError);
      }
    }
    
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

    // Delete artwork notes/messages
    try {
      await db.execute(sql`DELETE FROM artwork_notes WHERE order_id = ${orderId}`);
    } catch (e) {
      // Table might not exist, continue
    }

    // Delete order designs links
    try {
      await db.execute(sql`DELETE FROM order_designs WHERE order_id = ${orderId}`);
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
