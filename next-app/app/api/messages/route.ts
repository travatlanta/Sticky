import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages } from '../../../../shared/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // TODO: Get userId from NextAuth session when fully integrated
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const userMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json(userMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ message: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: Get userId from NextAuth session when fully integrated
    if (!body.userId) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const { userId, content, orderId } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ message: 'Message content is required' }, { status: 400 });
    }

    // Create user message
    const [userMessage] = await db
      .insert(messages)
      .values({
        userId,
        orderId: orderId || null,
        senderType: 'user',
        content: content.trim(),
        isRead: false,
        isFromHuman: true,
        needsHumanSupport: false,
      })
      .returning();

    // TODO: Generate AI response when OpenAI integration is set up
    // For now, just return the user message
    // The AI response generation can be added later with:
    // - OpenAI API call with system prompt
    // - Create admin message with AI response
    // - Handle escalation if needed

    return NextResponse.json(userMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
  }
}
