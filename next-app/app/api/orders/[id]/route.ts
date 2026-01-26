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
    
    // Try extended query first, fall back to basic query if columns don't exist
    let row: any = null;
    
    try {
      // Extended query with new columns
      const result = await db.execute(sql`
        SELECT id, order_number, user_id, status, subtotal, shipping_cost, 
               tax_amount, discount_amount, total_amount, shipping_address, 
               notes, tracking_number, created_at, admin_design_id, created_by_admin_id,
               customer_email
        FROM orders 
        WHERE id = ${orderId}
      `);
      row = result.rows?.[0] || null;
    } catch (extendedQueryError: any) {
      console.log(`[Order API] Extended query failed, trying basic query:`, extendedQueryError.message);
      
      // Fallback to basic columns only
      const basicResult = await db.execute(sql`
        SELECT id, order_number, user_id, status, subtotal, shipping_cost, 
               tax_amount, discount_amount, total_amount, shipping_address, 
               notes, tracking_number, created_at
        FROM orders 
        WHERE id = ${orderId}
      `);
      row = basicResult.rows?.[0] || null;
    }
    
    console.log(`[Order API] Raw query result for order ${orderId}:`, row);
    
    if (!row) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const customerInfo = parseNotesForCustomerInfo(row.notes);
    
    // Use values from main query - handle missing columns gracefully
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
      customerEmail: row.customer_email || customerInfo.email,
      customerPhone: customerInfo.phone,
      adminDesignId: row.admin_design_id || null,
      createdByAdminId: row.created_by_admin_id || null,
    };
    
    console.log(`[Order API] Order ${orderId} - status: ${order.status}, adminDesignId: ${order.adminDesignId}`);
    
    // Fetch admin design - try multiple methods
    let adminDesign = null;
    
    // Method 1: Try using orders.admin_design_id
    if (order.adminDesignId) {
      console.log(`[Order ${order.id}] Method 1: Fetching admin design with id ${order.adminDesignId}`);
      try {
        const designResult = await db.execute(sql`
          SELECT id, name, preview_url, high_res_export_url, custom_shape_url 
          FROM designs 
          WHERE id = ${order.adminDesignId}
        `);
        
        if (designResult.rows && designResult.rows.length > 0) {
          const d = designResult.rows[0] as any;
          console.log(`[Order ${order.id}] Found admin design:`, { id: d.id, name: d.name, previewUrl: d.preview_url?.substring(0, 50) });
          const designName = d.name || '';
          adminDesign = {
            id: d.id,
            name: d.name,
            previewUrl: d.preview_url,
            artworkUrl: d.preview_url || null,
            highResExportUrl: d.high_res_export_url,
            customShapeUrl: d.custom_shape_url,
            status: 'admin_review',
            isAdminDesign: true,
            isCustomerUpload: false,
            isFlagged: designName.includes('[FLAGGED]'),
          };
        }
      } catch (designError) {
        console.error(`[Order ${order.id}] Error fetching admin design:`, designError);
      }
    }
    
    // Method 2: Search designs table by name pattern if no admin design found yet
    if (!adminDesign) {
      console.log(`[Order ${order.id}] Method 2: Searching for [ADMIN_DESIGN] by order number`);
      try {
        const searchPattern = `%Order #${order.orderNumber}%`;
        const adminDesignSearch = await db.execute(sql`
          SELECT id, name, preview_url, high_res_export_url, custom_shape_url 
          FROM designs 
          WHERE name LIKE ${searchPattern} AND name LIKE '%[ADMIN_DESIGN]%'
          ORDER BY id DESC
          LIMIT 1
        `);
        
        if (adminDesignSearch.rows && adminDesignSearch.rows.length > 0) {
          const d = adminDesignSearch.rows[0] as any;
          console.log(`[Order ${order.id}] Found admin design by search:`, { id: d.id, name: d.name });
          const designName = d.name || '';
          adminDesign = {
            id: d.id,
            name: d.name,
            previewUrl: d.preview_url,
            artworkUrl: d.preview_url || null,
            highResExportUrl: d.high_res_export_url,
            customShapeUrl: d.custom_shape_url,
            status: 'admin_review',
            isAdminDesign: true,
            isCustomerUpload: false,
            isFlagged: designName.includes('[FLAGGED]'),
          };
        } else {
          console.log(`[Order ${order.id}] No admin design found by search pattern`);
        }
      } catch (searchError) {
        console.error(`[Order ${order.id}] Error searching for admin design:`, searchError);
      }
    }
    
    if (!adminDesign) {
      console.log(`[Order ${order.id}] No admin design found via any method`);
    }

    // Get order items using raw SQL for production compatibility
    let items: any[] = [];
    try {
      const itemsResult = await db.execute(sql`
        SELECT id, order_id, product_id, design_id, quantity, unit_price, selected_options
        FROM order_items
        WHERE order_id = ${order.id}
      `);
      items = (itemsResult.rows || []).map((row: any) => ({
        id: row.id,
        orderId: row.order_id,
        productId: row.product_id,
        designId: row.design_id,
        quantity: row.quantity,
        unitPrice: row.unit_price,
        selectedOptions: row.selected_options,
      }));
    } catch (itemsError) {
      console.error(`[Order ${order.id}] Error fetching items with design_id:`, itemsError);
      // Fallback query without design_id column
      const itemsResult = await db.execute(sql`
        SELECT id, order_id, product_id, quantity, unit_price, selected_options
        FROM order_items
        WHERE order_id = ${order.id}
      `);
      items = (itemsResult.rows || []).map((row: any) => ({
        id: row.id,
        orderId: row.order_id,
        productId: row.product_id,
        designId: null,
        quantity: row.quantity,
        unitPrice: row.unit_price,
        selectedOptions: row.selected_options,
      }));
    }

    console.log(`[Order ${order.id}] Found ${items.length} order items`);
    items.forEach((item: any, idx: number) => {
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
          console.log(`[Order ${order.id}] Fetching design ${item.designId} (type: ${typeof item.designId}) for item ${item.id}`);
          try {
            // Use raw SQL to avoid any type conversion issues
            const designResult = await db.execute(sql`
              SELECT id, name, preview_url, high_res_export_url, custom_shape_url 
              FROM designs WHERE id = ${item.designId}
            `);
            const d = designResult.rows?.[0] as any;
            if (d) {
              // Map from snake_case to camelCase
              const designData = {
                id: d.id,
                name: d.name,
                previewUrl: d.preview_url,
                highResExportUrl: d.high_res_export_url,
                customShapeUrl: d.custom_shape_url,
              };
              console.log(`[Order ${order.id}] Design found via SQL:`, { id: designData.id, name: designData.name, previewUrl: designData.previewUrl?.substring(0, 50) });
              
              const designName = designData.name || '';
              const isApproved = designName.includes('[APPROVED]');
              const isFlagged = designName.includes('[FLAGGED]');
              const isAdminDesign = designName.includes('[ADMIN_DESIGN]');
              const isCustomerUpload = designName.includes('[CUSTOMER_UPLOAD]');
              const isPending = designName.includes('[PENDING]');
              
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
                id: designData.id,
                name: designData.name,
                previewUrl: designData.previewUrl,
                artworkUrl: designData.previewUrl || null,
                highResExportUrl: designData.highResExportUrl,
                customShapeUrl: designData.customShapeUrl,
                status,
                isAdminDesign,
                isCustomerUpload,
                isFlagged,
              };
            } else {
              console.log(`[Order ${order.id}] Design ${item.designId} NOT FOUND in database`);
            }
          } catch (designError: any) {
            console.error(`[Order ${order.id}] Error fetching design ${item.designId}:`, designError.message);
          }
        } else {
          console.log(`[Order ${order.id}] Item ${item.id} has NO designId`);
        }
        
        // If no item-level design, use order-level admin design
        if (!design && adminDesign) {
          console.log(`[Order ${order.id}] Using admin design for item ${item.id}`);
          design = adminDesign;
        }

        return { ...item, product, design };
      })
    );

    // Log order data for debugging
    console.log(`[Order ${order.id}] Returning: status=${order.status}, items=${enrichedItems.length}`);
    enrichedItems.forEach((item: any, idx: number) => {
      console.log(`[Order ${order.id}] Item ${idx}: designId=${item.designId}, hasDesign=${!!item.design}, previewUrl=${item.design?.previewUrl?.substring(0, 50) || 'none'}`);
    });
    
    // Return with no-cache headers to prevent stale data
    return NextResponse.json({ ...order, items: enrichedItems }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ message: 'Failed to fetch order' }, { status: 500 });
  }
}
