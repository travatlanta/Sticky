import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, users } from '../../../../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const escalatedMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.needsHumanSupport, true))
      .orderBy(desc(messages.escalatedAt));

    const uniqueUserIds = Array.from(new Set(escalatedMessages.map((m) => m.userId))).filter((id): id is string => id !== null);

    const conversations = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        const userMessages = escalatedMessages.filter((m) => m.userId === userId);
        const latestMessage = userMessages[0];

        return {
          userId,
          user: user ? { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } : null,
          latestMessage,
          messageCount: userMessages.length,
          needsReply: true,
        };
      })
    );

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching inbox:', error);
    return NextResponse.json({ message: 'Failed to fetch inbox' }, { status: 500 });
  }
}
