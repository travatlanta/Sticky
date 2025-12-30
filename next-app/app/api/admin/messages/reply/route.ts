export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, content, orderId } = body;

    if (!userId || !content) {
      return NextResponse.json({ message: 'User ID and content are required' }, { status: 400 });
    }

    const [adminMessage] = await db
      .insert(messages)
      .values({
        userId,
        orderId: orderId || null,
        senderType: 'admin',
        content: content.trim(),
        isRead: false,
        isFromHuman: true,
        needsHumanSupport: false,
      })
      .returning();

    await db
      .update(messages)
      .set({ needsHumanSupport: false })
      .where(eq(messages.userId, userId));

    return NextResponse.json(adminMessage);
  } catch (error) {
    console.error('Error sending reply:', error);
    return NextResponse.json({ message: 'Failed to send reply' }, { status: 500 });
  }
}
