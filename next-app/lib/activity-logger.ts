import { db } from '@/lib/db';
import { activityLogs } from '@shared/schema';
import { sql } from 'drizzle-orm';

type ActivityLogType = 
  | 'login_success'
  | 'login_failed'
  | 'order_lookup'
  | 'order_not_found'
  | 'page_error'
  | 'api_error'
  | 'checkout_started'
  | 'checkout_completed'
  | 'checkout_failed'
  | 'session_started'
  | 'general';

interface LogActivityParams {
  userEmail?: string | null;
  userId?: string | null;
  eventType: ActivityLogType;
  eventMessage: string;
  eventDetails?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestPath?: string | null;
  statusCode?: number | null;
  errorMessage?: string | null;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO activity_logs (
        user_email,
        user_id,
        event_type,
        event_message,
        event_details,
        ip_address,
        user_agent,
        request_path,
        status_code,
        error_message
      ) VALUES (
        ${params.userEmail || null},
        ${params.userId || null},
        ${params.eventType},
        ${params.eventMessage},
        ${params.eventDetails ? JSON.stringify(params.eventDetails) : null}::jsonb,
        ${params.ipAddress || null},
        ${params.userAgent || null},
        ${params.requestPath || null},
        ${params.statusCode || null},
        ${params.errorMessage || null}
      )
    `);
  } catch (error) {
    console.error('[Activity Logger] Failed to log activity:', error);
  }
}

export function getClientInfo(request: Request): { ipAddress: string | null; userAgent: string | null } {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || null;
  const userAgent = request.headers.get('user-agent') || null;
  return { ipAddress, userAgent };
}
