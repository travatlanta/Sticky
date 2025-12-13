import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages } from '@shared/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    const orderMessages = await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.userId, session.user.id),
        eq(messages.orderId, orderId)
      ))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json(orderMessages);
  } catch (error) {
    console.error('Error fetching order messages:', error);
    return NextResponse.json({ message: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();

    if (!body.content || body.content.trim() === '') {
      return NextResponse.json({ message: 'Message content is required' }, { status: 400 });
    }

    const [message] = await db
      .insert(messages)
      .values({
        userId: session.user.id,
        orderId,
        senderType: 'user',
        content: body.content.trim(),
        isRead: false,
        isFromHuman: true,
        needsHumanSupport: false,
      })
      .returning();

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
  }
}
