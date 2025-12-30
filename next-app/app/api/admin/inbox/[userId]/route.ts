export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, users } from '@shared/schema';
import { eq, asc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { userId } = await params;

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    const conversation = await db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } : null,
      messages: conversation,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ message: 'Failed to fetch conversation' }, { status: 500 });
  }
}
