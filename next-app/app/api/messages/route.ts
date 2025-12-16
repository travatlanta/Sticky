export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages } from '@shared/schema';
import { eq, asc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import openai, { SYSTEM_PROMPT } from '@/lib/openai';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const userMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.userId, session.user.id))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json(userMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ message: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { content, orderId } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ message: 'Message content is required' }, { status: 400 });
    }

    const userId = session.user.id;
    const userContent = content.trim();

    // Check if user is requesting human support
    const humanPhrases = ['speak to a person', 'talk to human', 'real person', 'need help from a human', 'human support', 'talk to someone', 'speak with someone'];
    const needsHuman = humanPhrases.some(phrase => userContent.toLowerCase().includes(phrase));

    // Create user message
    const [userMessage] = await db
      .insert(messages)
      .values({
        userId,
        orderId: orderId || null,
        senderType: 'user',
        content: userContent,
        isRead: false,
        isFromHuman: true,
        needsHumanSupport: needsHuman,
        escalatedAt: needsHuman ? new Date() : null,
      })
      .returning();

    // Get conversation history for context
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(asc(messages.createdAt))
      .limit(10);

    // Build messages array for OpenAI
    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    history.forEach(msg => {
      if (msg.senderType === 'user') {
        chatMessages.push({ role: 'user', content: msg.content });
      } else {
        chatMessages.push({ role: 'assistant', content: msg.content });
      }
    });

    // Generate AI response
    let aiResponse = "I'm here to help! How can I assist you today?";
    
    if (needsHuman) {
      aiResponse = "I understand you'd like to speak with a member of our support team. I've flagged this conversation for our team, and someone will get back to you soon. In the meantime, is there anything else I can help you with?";
    } else {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: chatMessages,
          max_tokens: 500,
        });
        aiResponse = completion.choices[0]?.message?.content || aiResponse;
      } catch (aiError) {
        console.error('OpenAI API error:', aiError);
        aiResponse = "Thanks for your message! Our team will get back to you shortly. In the meantime, feel free to browse our products or continue working on your designs.";
      }
    }

    // Create AI response message
    const [aiMessage] = await db
      .insert(messages)
      .values({
        userId,
        orderId: orderId || null,
        senderType: 'admin',
        content: aiResponse,
        isRead: false,
        isFromHuman: false,
        needsHumanSupport: false,
      })
      .returning();

    return NextResponse.json({ userMessage, aiMessage });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
  }
}
