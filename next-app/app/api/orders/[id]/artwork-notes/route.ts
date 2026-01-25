import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/db";

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

    const orderCheck = await pool.query(
      `SELECT id, user_id FROM orders WHERE id = $1`,
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderCheck.rows[0];
    if (!isAdmin && order.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const notesResult = await pool.query(
      `SELECT an.*, u.first_name, u.last_name, u.email
       FROM artwork_notes an
       LEFT JOIN users u ON an.user_id = u.id
       WHERE an.order_id = $1
       ORDER BY an.created_at ASC`,
      [orderId]
    );

    const notes = notesResult.rows.map(row => ({
      id: row.id,
      orderId: row.order_id,
      orderItemId: row.order_item_id,
      userId: row.user_id,
      senderType: row.sender_type,
      content: row.content,
      isRead: row.is_read,
      createdAt: row.created_at,
      senderName: row.first_name && row.last_name 
        ? `${row.first_name} ${row.last_name}` 
        : row.email || (row.sender_type === 'admin' ? 'Admin' : 'Customer'),
    }));

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching artwork notes:", error);
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

    const orderCheck = await pool.query(
      `SELECT id, user_id FROM orders WHERE id = $1`,
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderCheck.rows[0];
    if (!isAdmin && order.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { content, orderItemId } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const senderType = isAdmin ? 'admin' : 'user';

    const insertResult = await pool.query(
      `INSERT INTO artwork_notes (order_id, order_item_id, user_id, sender_type, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [orderId, orderItemId || null, userId, senderType, content.trim()]
    );

    return NextResponse.json({ 
      success: true, 
      noteId: insertResult.rows[0].id,
      createdAt: insertResult.rows[0].created_at 
    });
  } catch (error) {
    console.error("Error creating artwork note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
