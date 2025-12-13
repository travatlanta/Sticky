import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages } from '../../../../../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const unreadMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.isRead, false))
      .orderBy(desc(messages.createdAt));

    return NextResponse.json(unreadMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ message: 'Failed to fetch messages' }, { status: 500 });
  }
}
