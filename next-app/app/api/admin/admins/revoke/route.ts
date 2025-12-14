export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    if (userId === (session.user as any).id) {
      return NextResponse.json({ message: 'You cannot revoke your own admin access' }, { status: 400 });
    }

    const [user] = await db
      .update(users)
      .set({ isAdmin: false })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error revoking admin:', error);
    return NextResponse.json({ message: 'Failed to revoke admin' }, { status: 500 });
  }
}
