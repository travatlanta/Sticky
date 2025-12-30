export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const deployTime = new Date().toISOString();
  const codeVersion = 'v3-dec30-debug';
  
  try {
    console.log('Debug auth: Starting');
    const session = await getServerSession(authOptions);
    console.log('Debug auth: Session obtained');
    
    return NextResponse.json({
      codeVersion,
      deployTime,
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email || null,
      userId: (session?.user as any)?.id || null,
      isAdmin: (session?.user as any)?.isAdmin || false,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : [],
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({
      codeVersion,
      deployTime,
      error: true,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
