export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { sendEmail, generateOrderMessageEmail } from "@/lib/email";

async function ensureArtworkNotesTable() {
  try {
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sender_type') THEN
          CREATE TYPE sender_type AS ENUM ('user', 'admin');
        END IF;
      END $$;
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS artwork_notes (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) NOT NULL,
        order_item_id INTEGER REFERENCES order_items(id),
        user_id VARCHAR REFERENCES users(id),
        sender_type sender_type NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (error) {
    console.error("Error ensuring artwork_notes table:", error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const isAdmin = (session.user as any).isAdmin === true;

    const orderResult = await db.execute(sql`
      SELECT id, user_id FROM orders WHERE id = ${orderId}
    `);
    
    const order = orderResult.rows[0] as any;
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isAdmin && order.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await ensureArtworkNotesTable();

    const notesResult = await db.execute(sql`
      SELECT 
        an.id,
        an.order_id,
        an.order_item_id,
        an.user_id,
        an.sender_type,
        an.content,
        an.is_read,
        an.created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM artwork_notes an
      LEFT JOIN users u ON an.user_id = u.id
      WHERE an.order_id = ${orderId}
      ORDER BY an.created_at ASC
    `);

    const notes = (notesResult.rows || []).map((row: any) => {
      let senderName = row.sender_type === 'admin' ? 'Sticky Banditos Team' : 'Customer';
      
      if (row.first_name && row.last_name) {
        senderName = `${row.first_name} ${row.last_name}`;
      } else if (row.email) {
        senderName = row.email;
      }

      return {
        id: row.id,
        orderId: row.order_id,
        orderItemId: row.order_item_id,
        userId: row.user_id,
        senderType: row.sender_type,
        content: row.content,
        isRead: row.is_read,
        createdAt: row.created_at,
        senderName,
      };
    });

    return NextResponse.json({ notes }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      }
    });
  } catch (error: any) {
    console.error("Error fetching artwork notes:", error);
    if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
      return NextResponse.json({ notes: [] });
    }
    if (error?.code === '42P01') {
      return NextResponse.json({ notes: [] });
    }
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const isAdmin = (session.user as any).isAdmin === true;

    const orderResult = await db.execute(sql`
      SELECT id, user_id, order_number FROM orders WHERE id = ${orderId}
    `);
    
    const order = orderResult.rows[0] as any;
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isAdmin && order.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { content, orderItemId } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    await ensureArtworkNotesTable();

    const senderType = isAdmin ? 'admin' : 'user';

    const insertResult = await db.execute(sql`
      INSERT INTO artwork_notes (order_id, order_item_id, user_id, sender_type, content)
      VALUES (${orderId}, ${orderItemId || null}, ${userId}, ${senderType}::sender_type, ${content.trim()})
      RETURNING id, created_at
    `);

    const insertedNote = insertResult.rows[0] as any;

    if (isAdmin && order.user_id) {
      // Admin sending message to customer - send email to customer
      try {
        const customerResult = await db.execute(sql`
          SELECT email, first_name, last_name FROM users WHERE id = ${order.user_id}
        `);
        
        const customer = customerResult.rows[0] as any;

        if (customer?.email) {
          const customerName = customer.first_name && customer.last_name 
            ? `${customer.first_name} ${customer.last_name}` 
            : customer.first_name || '';
          
          const emailContent = generateOrderMessageEmail({
            customerName,
            orderId,
            message: content.trim(),
          });

          await sendEmail({
            to: customer.email,
            ...emailContent,
          });
        }
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }
    } else if (!isAdmin) {
      // Customer sending message - send email to admin (Mike)
      const ADMIN_EMAIL = 'mhobbs.stickybanditos@gmail.com';
      try {
        // Get customer name
        const customerResult = await db.execute(sql`
          SELECT first_name, last_name, email FROM users WHERE id = ${userId}
        `);
        const customer = customerResult.rows[0] as any;
        const customerName = customer?.first_name && customer?.last_name 
          ? `${customer.first_name} ${customer.last_name}` 
          : customer?.email || 'Customer';
        
        const emailContent = {
          subject: `Customer Message - Order #${order.order_number}`,
          html: `
            <h2>New Customer Message</h2>
            <p><strong>Order:</strong> #${order.order_number}</p>
            <p><strong>From:</strong> ${customerName}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #333;">${content.trim()}</blockquote>
            <p><a href="${process.env.SITE_URL || 'https://stickybanditos.com'}/admin/orders?id=${orderId}">View Order in Admin</a></p>
          `,
          text: `New Customer Message\nOrder: #${order.order_number}\nFrom: ${customerName}\nMessage: ${content.trim()}\n\nView order: ${process.env.SITE_URL || 'https://stickybanditos.com'}/admin/orders?id=${orderId}`,
        };

        await sendEmail({
          to: ADMIN_EMAIL,
          ...emailContent,
        });
      } catch (emailError) {
        console.error("Failed to send admin email notification:", emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      noteId: insertedNote.id,
      createdAt: insertedNote.created_at 
    });
  } catch (error: any) {
    console.error("Error creating artwork note:", error);
    return NextResponse.json({ 
      error: error?.message || "Failed to create note",
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}
