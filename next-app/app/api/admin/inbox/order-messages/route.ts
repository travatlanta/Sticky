export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all order conversations grouped by order with latest message
    const result = await db.execute(sql`
      SELECT 
        o.id as order_id,
        o.order_number,
        o.status as order_status,
        o.total,
        o.created_at as order_date,
        o.user_id,
        u.email as customer_email,
        u.first_name,
        u.last_name,
        (
          SELECT COUNT(*) FROM artwork_notes an WHERE an.order_id = o.id
        ) as message_count,
        (
          SELECT COUNT(*) FROM artwork_notes an 
          WHERE an.order_id = o.id AND an.sender_type = 'user' AND an.is_read = false
        ) as unread_count,
        latest.content as last_message,
        latest.sender_type as last_sender,
        latest.created_at as last_message_at
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT content, sender_type, created_at 
        FROM artwork_notes 
        WHERE order_id = o.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) latest ON true
      WHERE EXISTS (SELECT 1 FROM artwork_notes an WHERE an.order_id = o.id)
      ORDER BY latest.created_at DESC NULLS LAST
      LIMIT 50
    `);

    const conversations = (result.rows || []).map((row: any) => ({
      orderId: row.order_id,
      orderNumber: row.order_number,
      orderStatus: row.order_status,
      orderTotal: parseFloat(row.total || 0),
      orderDate: row.order_date,
      userId: row.user_id,
      customerEmail: row.customer_email,
      customerName: row.first_name && row.last_name 
        ? `${row.first_name} ${row.last_name}` 
        : row.first_name || row.customer_email || 'Customer',
      messageCount: parseInt(row.message_count || 0),
      unreadCount: parseInt(row.unread_count || 0),
      lastMessage: row.last_message,
      lastSender: row.last_sender,
      lastMessageAt: row.last_message_at,
    }));

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error("Error fetching order messages:", error);
    // Handle table not existing
    if (error?.message?.includes('does not exist') || error?.code === '42P01') {
      return NextResponse.json({ conversations: [] });
    }
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
