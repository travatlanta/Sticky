import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { artworkNotes, orders, users } from "@shared/schema";
import { eq, asc } from "drizzle-orm";

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

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: { id: true, userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isAdmin && order.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const notes = await db.query.artworkNotes.findMany({
      where: eq(artworkNotes.orderId, orderId),
      orderBy: [asc(artworkNotes.createdAt)],
    });

    const notesWithUserInfo = await Promise.all(
      notes.map(async (note) => {
        let senderName = note.senderType === 'admin' ? 'Admin' : 'Customer';
        
        if (note.userId) {
          const user = await db.query.users.findFirst({
            where: eq(users.id, note.userId),
            columns: { firstName: true, lastName: true, email: true },
          });
          if (user) {
            senderName = user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.email || senderName;
          }
        }

        return {
          id: note.id,
          orderId: note.orderId,
          orderItemId: note.orderItemId,
          userId: note.userId,
          senderType: note.senderType,
          content: note.content,
          isRead: note.isRead,
          createdAt: note.createdAt,
          senderName,
        };
      })
    );

    return NextResponse.json({ notes: notesWithUserInfo });
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

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: { id: true, userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isAdmin && order.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { content, orderItemId } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const senderType = isAdmin ? 'admin' : 'user';

    const [insertedNote] = await db.insert(artworkNotes).values({
      orderId,
      orderItemId: orderItemId || null,
      userId,
      senderType: senderType as 'admin' | 'user',
      content: content.trim(),
    }).returning({ id: artworkNotes.id, createdAt: artworkNotes.createdAt });

    return NextResponse.json({ 
      success: true, 
      noteId: insertedNote.id,
      createdAt: insertedNote.createdAt 
    });
  } catch (error) {
    console.error("Error creating artwork note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
