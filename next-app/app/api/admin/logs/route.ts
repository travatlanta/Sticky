export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const eventType = searchParams.get('eventType');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = sql`1=1`;
    
    if (email) {
      whereClause = sql`${whereClause} AND LOWER(user_email) LIKE ${`%${email.toLowerCase()}%`}`;
    }
    
    if (eventType && eventType !== 'all') {
      whereClause = sql`${whereClause} AND event_type = ${eventType}`;
    }

    const result = await db.execute(sql`
      SELECT 
        id, user_email, user_id, event_type, event_message, 
        event_details, ip_address, user_agent, request_path, 
        status_code, error_message, created_at
      FROM activity_logs
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total
      FROM activity_logs
      WHERE ${whereClause}
    `);

    const logs = (result.rows || []).map((row: any) => ({
      id: row.id,
      userEmail: row.user_email,
      userId: row.user_id,
      eventType: row.event_type,
      eventMessage: row.event_message,
      eventDetails: row.event_details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      requestPath: row.request_path,
      statusCode: row.status_code,
      errorMessage: row.error_message,
      createdAt: row.created_at,
    }));

    const total = parseInt((countResult.rows[0] as any)?.total || '0');

    return NextResponse.json({
      logs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ message: 'Failed to fetch logs' }, { status: 500 });
  }
}
