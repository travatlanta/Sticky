export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { desc, and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { emailDeliveries, orders } from "@shared/schema";

const ALLOWED_STATUSES = new Set(["pending", "sent", "failed"]);
const ALLOWED_TYPES = new Set(["order_confirmation"]);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const orderId = searchParams.get("orderId");

  const whereParts: any[] = [];

  if (orderId) {
    const parsedOrderId = Number(orderId);
    if (!Number.isFinite(parsedOrderId) || parsedOrderId <= 0) {
      return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
    }
    whereParts.push(eq(emailDeliveries.orderId, parsedOrderId));
  }

  if (status && ALLOWED_STATUSES.has(status)) {
    whereParts.push(eq(emailDeliveries.status as any, status as any));
  }
  if (type && ALLOWED_TYPES.has(type)) {
    whereParts.push(eq(emailDeliveries.type, type));
  }

  try {
    const deliveries = await db
      .select({
        id: emailDeliveries.id,
        orderId: emailDeliveries.orderId,
        orderNumber: orders.orderNumber,
        type: emailDeliveries.type,
        toEmail: emailDeliveries.toEmail,
        status: emailDeliveries.status,
        attempts: emailDeliveries.attempts,
        lastError: emailDeliveries.lastError,
        lastAttemptAt: emailDeliveries.lastAttemptAt,
        sentAt: emailDeliveries.sentAt,
        createdAt: emailDeliveries.createdAt,
      })
      .from(emailDeliveries)
      .leftJoin(orders, eq(emailDeliveries.orderId, orders.id))
      .where(whereParts.length ? and(...whereParts) : undefined)
      .orderBy(desc(emailDeliveries.createdAt))
      .limit(200);

    return NextResponse.json({ deliveries });
  } catch (err: any) {
    // If migrations haven't been run yet, don't blow up admin.
    const code = err?.code || err?.cause?.code;
    const msg = err?.message || "Failed to query email deliveries";

    // Postgres: 42P01 undefined_table, 42704 undefined_object (enum)
    if (code === "42P01" || code === "42704") {
      return NextResponse.json({
        deliveries: [],
        warning:
          "email_deliveries table/enums not found. Run /api/migrate (admin) and try again.",
      });
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}