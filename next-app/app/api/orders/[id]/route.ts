export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orderItems, products, designs } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    
    // Use raw SQL matching the working orders list endpoint
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
      notes: row.notes,
      trackingNumber: row.tracking_number,
      createdAt: row.created_at,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      adminDesignId: null,
      createdByAdminId: null,
    };
    
    // Try to get admin_design_id separately (column may not exist in production)
    try {
      const adminResult = await db.execute(sql`
        SELECT admin_design_id, created_by_admin_id FROM orders WHERE id = ${orderId}
      `);
      if (adminResult.rows && adminResult.rows.length > 0) {
        const adminRow = adminResult.rows[0] as any;
        order.adminDesignId = adminRow.admin_design_id || null;
        order.createdByAdminId = adminRow.created_by_admin_id || null;
      }
    } catch (e) {
      // Column doesn't exist, that's OK
    }
    
    // Fetch admin design if exists (order-level design uploaded by admin)
    let adminDesign = null;
    if (order.adminDesignId) {
      const [d] = await db
        .select()
        .from(designs)
        .where(eq(designs.id, order.adminDesignId));
      if (d) {
        const designName = d.name || '';
        adminDesign = {
          id: d.id,
          name: d.name,
          previewUrl: d.previewUrl,
          artworkUrl: d.previewUrl || null,
          highResExportUrl: d.highResExportUrl,
          customShapeUrl: d.customShapeUrl,
          status: 'admin_review',
          isAdminDesign: true,
          isCustomerUpload: false,
          isFlagged: designName.includes('[FLAGGED]'),
        };
      }
    }

    // Get order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    console.log(`[Order ${order.id}] Found ${items.length} order items`);
    items.forEach((item, idx) => {
      console.log(`[Order ${order.id}] Item ${idx}: id=${item.id}, designId=${item.designId}, productId=${item.productId}`);
    });

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
          console.log(`[Order ${order.id}] Fetching design ${item.designId} for item ${item.id}`);
          const [d] = await db
            .select()
            .from(designs)
            .where(eq(designs.id, item.designId));
          console.log(`[Order ${order.id}] Design found:`, d ? { id: d.id, name: d.name, previewUrl: d.previewUrl?.substring(0, 50) } : 'null');
          if (d) {
            const designName = d.name || '';
            const isApproved = designName.includes('[APPROVED]');
            const isFlagged = designName.includes('[FLAGGED]');
            const isAdminDesign = designName.includes('[ADMIN_DESIGN]');
            const isCustomerUpload = designName.includes('[CUSTOMER_UPLOAD]');
            const isPending = designName.includes('[PENDING]');
            
            // Determine status based on tags (match by-token route logic)
            let status: string = 'uploaded';
            if (isApproved) {
              status = 'approved';
            } else if (isFlagged) {
              status = 'flagged';
            } else if (isAdminDesign) {
              status = 'admin_review';
            } else if (isPending || isCustomerUpload) {
              status = 'pending';
            }
            
            design = {
              id: d.id,
              name: d.name,
              previewUrl: d.previewUrl,
              artworkUrl: d.previewUrl || null,
              highResExportUrl: d.highResExportUrl,
              customShapeUrl: d.customShapeUrl,
              status,
              isAdminDesign,
              isCustomerUpload,
              isFlagged,
            };
          }
        }
        
        // If no item-level design, use order-level admin design
        if (!design && adminDesign) {
          console.log(`[Order ${order.id}] Using admin design for item ${item.id}`);
          design = adminDesign;
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
