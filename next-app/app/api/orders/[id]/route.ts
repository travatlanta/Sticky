export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, products, designs } from '@shared/schema';
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
    
    // Use Drizzle ORM with the orders table for proper field mapping
    const [orderData] = await db.select().from(orders).where(eq(orders.id, orderId));
    
    if (!orderData) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const customerInfo = parseNotesForCustomerInfo(orderData.notes);
    
    const order = {
      id: orderData.id,
      orderNumber: orderData.orderNumber,
      userId: orderData.userId,
      status: orderData.status,
      subtotal: orderData.subtotal,
      shippingCost: orderData.shippingCost,
      taxAmount: orderData.taxAmount,
      discountAmount: orderData.discountAmount,
      totalAmount: orderData.totalAmount,
      shippingAddress: orderData.shippingAddress,
      notes: orderData.notes,
      trackingNumber: orderData.trackingNumber,
      createdAt: orderData.createdAt,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      adminDesignId: (orderData as any).adminDesignId || null,
      createdByAdminId: (orderData as any).createdByAdminId || null,
    };
    
    // Fetch admin design if exists (order-level design uploaded by admin)
    let adminDesign = null;
    if (order.adminDesignId) {
      console.log(`[Order ${order.id}] Fetching admin design ${order.adminDesignId}`);
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
        console.log(`[Order ${order.id}] Admin design found:`, { id: d.id, name: d.name });
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
