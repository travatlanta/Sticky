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

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      if (existingUser.isAdmin) {
        return NextResponse.json({ message: 'User is already an admin' }, { status: 400 });
      }

      const [updatedUser] = await db
        .update(users)
        .set({ isAdmin: true })
        .where(eq(users.id, existingUser.id))
        .returning();

      return NextResponse.json({ success: true, user: updatedUser });
    }

    return NextResponse.json({ 
      message: 'User not found. They must register first before being made an admin.' 
    }, { status: 404 });
  } catch (error) {
    console.error('Error inviting admin:', error);
    return NextResponse.json({ message: 'Failed to invite admin' }, { status: 500 });
  }
}
