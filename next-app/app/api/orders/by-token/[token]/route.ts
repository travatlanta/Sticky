export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, products, users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// Parse customer info from notes field (fallback for production)
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
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 32) {
      return NextResponse.json({ message: "Invalid token" }, { status: 400 });
    }

    // Use raw SQL to search for token in notes field (production compatible)
    // The token is stored in notes as "Payment Link: <token>"
    const result = await db.execute(sql`
      SELECT id, order_number, user_id, status, subtotal, shipping_cost, 
             tax_amount, discount_amount, total_amount, shipping_address, notes
      FROM orders 
      WHERE notes LIKE ${'%Payment Link: ' + token + '%'}
      LIMIT 1
    `);

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const orderRow = result.rows[0] as any;
    const order = {
      id: orderRow.id,
      orderNumber: orderRow.order_number,
      userId: orderRow.user_id,
      status: orderRow.status,
      subtotal: orderRow.subtotal,
      shippingCost: orderRow.shipping_cost,
      taxAmount: orderRow.tax_amount,
      discountAmount: orderRow.discount_amount,
      totalAmount: orderRow.total_amount,
      shippingAddress: orderRow.shipping_address,
      notes: orderRow.notes,
    };

    // Parse customer info from notes
    const customerInfo = parseNotesForCustomerInfo(order.notes);

    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        selectedOptions: orderItems.selectedOptions,
        designId: orderItems.designId,
        productName: products.name,
        productThumbnail: products.thumbnailUrl,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    // Fetch design data for items that have designs
    const designIds = items.filter(i => i.designId).map(i => i.designId as number);
    let designsMap: Record<number, any> = {};
    
    if (designIds.length > 0) {
      // Fetch each design individually to avoid array parameter issues
      for (const designId of designIds) {
        try {
          const designsResult = await db.execute(sql`
            SELECT id, name, preview_url, canvas_json
            FROM designs 
            WHERE id = ${designId}
          `);
          
          if (designsResult.rows && designsResult.rows.length > 0) {
            const row = designsResult.rows[0] as any;
            const designName = row.name || '';
            
            // Parse all possible status tags
            const isApproved = designName.includes('[APPROVED]');
            const isFlagged = designName.includes('[FLAGGED]');
            const isAdminDesign = designName.includes('[ADMIN_DESIGN]');
            const isCustomerUpload = designName.includes('[CUSTOMER_UPLOAD]');
            const isPending = designName.includes('[PENDING]');
            
            // Determine status based on tags
            let status = 'uploaded';
            if (isApproved) {
              status = 'approved';
            } else if (isFlagged) {
              status = 'flagged';
            } else if (isAdminDesign) {
              status = 'admin_review';
            } else if (isPending || isCustomerUpload) {
              status = 'pending';
            }
            
            designsMap[row.id] = {
              id: row.id,
              name: row.name,
              previewUrl: row.preview_url,
              artworkUrl: row.preview_url,
              status,
            };
          }
        } catch (err) {
          console.error(`Error fetching design ${designId}:`, err);
        }
      }
    }

    const formattedItems = items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      selectedOptions: item.selectedOptions,
      designId: item.designId,
      design: item.designId ? designsMap[item.designId] || null : null,
      product: {
        name: item.productName,
        thumbnailUrl: item.productThumbnail,
      },
    }));

    // Check if customer email has an existing account
    let hasAccount = false;
    if (order.userId) {
      hasAccount = true;
    } else if (customerInfo.email) {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, customerInfo.email),
      });
      hasAccount = !!existingUser;
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: customerInfo.name || null,
      customerEmail: customerInfo.email || null,
      hasAccount,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      items: formattedItems,
    });
  } catch (error) {
    console.error("Error fetching order by token:", error);
    return NextResponse.json({ message: "Failed to fetch order" }, { status: 500 });
  }
}
