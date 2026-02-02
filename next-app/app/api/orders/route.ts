export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logActivity, getClientInfo } from '@/lib/activity-logger';

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

export async function GET(request: NextRequest) {
  const { ipAddress, userAgent } = getClientInfo(request);
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      await logActivity({
        eventType: 'order_lookup',
        eventMessage: 'Unauthenticated order lookup attempt',
        ipAddress,
        userAgent,
        requestPath: '/api/orders',
        statusCode: 401,
      });
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    
    const userId = String(session.user.id);
    const userEmail = session.user.email?.toLowerCase() || '';

    console.log(`[Orders API] Fetching orders for userId=${userId}, email=${userEmail}`);
    
    const result = await db.execute(sql`
      SELECT id, order_number, user_id, status, subtotal, shipping_cost, 
             tax_amount, discount_amount, total_amount, shipping_address, 
             notes, tracking_number, created_at, customer_email
      FROM orders 
      WHERE user_id = ${userId}
         OR LOWER(customer_email) = ${userEmail}
         OR (notes ILIKE ${'%Email: ' + userEmail + '%'})
      ORDER BY created_at DESC
    `);
    
    const ordersFound = result.rows?.length || 0;
    console.log(`[Orders API] Found ${ordersFound} orders for user`);
    
    await logActivity({
      userEmail,
      userId,
      eventType: ordersFound > 0 ? 'order_lookup' : 'order_not_found',
      eventMessage: ordersFound > 0 
        ? `Customer viewed ${ordersFound} orders` 
        : 'Customer looked up orders but found none',
      eventDetails: { ordersFound, matchedBy: 'userId/email/notes' },
      ipAddress,
      userAgent,
      requestPath: '/api/orders',
      statusCode: 200,
    });

    const userOrders = (result.rows || []).map((row: any) => {
      const customerInfo = parseNotesForCustomerInfo(row.notes);
      return {
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
      };
    });

    // Return with no-cache headers to prevent stale data
    return NextResponse.json(userOrders, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    
    await logActivity({
      eventType: 'api_error',
      eventMessage: `Orders API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      eventDetails: { error: String(error), stack: error instanceof Error ? error.stack : undefined },
      ipAddress,
      userAgent,
      requestPath: '/api/orders',
      statusCode: 500,
    });
    
    return NextResponse.json({ message: 'Failed to fetch orders' }, { status: 500 });
  }
}
