export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, users } from '@shared/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    // Fetch ALL messages (not just escalated ones) so admin can see every conversation
    const allMessages = await db
      .select()
      .from(messages)
      .orderBy(desc(messages.createdAt));

    const uniqueUserIds = Array.from(new Set(allMessages.map((m) => m.userId))).filter((id): id is string => id !== null);

    const conversations = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        const userMessages = allMessages.filter((m) => m.userId === userId);
        const latestMessage = userMessages[0];
        const hasEscalation = userMessages.some((m) => m.needsHumanSupport);

        const userName = user
          ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'
          : 'Unknown';

        return {
          userId,
          userEmail: user?.email || 'Unknown',
          userName,
          lastMessage: latestMessage?.content || '',
          lastMessageAt: latestMessage?.createdAt?.toISOString?.() || latestMessage?.createdAt || '',
          escalatedAt: latestMessage?.escalatedAt?.toISOString?.() || latestMessage?.escalatedAt || '',
          messageCount: userMessages.length,
          needsHumanSupport: hasEscalation,
        };
      })
    );

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching inbox:', error);
    return NextResponse.json({ message: 'Failed to fetch inbox' }, { status: 500 });
  }
}
