export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { sendArtworkApprovalEmail, sendAdminNotificationEmail } from "@/lib/email/sendNotificationEmails";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = (session.user as any).isAdmin === true;
    if (!isAdmin) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
    }

    const orderResult = await db.execute(sql`
      SELECT o.id, o.order_number, o.customer_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ${orderId}
    `);
    
    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0] as any;

    const itemsResult = await db.execute(sql`
      SELECT oi.id, oi.design_id, d.name as design_name
      FROM order_items oi
      LEFT JOIN designs d ON oi.design_id = d.id
      WHERE oi.order_id = ${orderId}
    `);

    for (const item of itemsResult.rows as any[]) {
      if (item.design_id && item.design_name) {
        let newName = item.design_name;
        
        if (!newName.includes('[FLAGGED]')) {
          if (newName.includes('[CUSTOMER_UPLOAD]')) {
            newName = newName.replace('[CUSTOMER_UPLOAD]', '[FLAGGED]');
          } else {
            newName = `[FLAGGED] ${newName}`;
          }
        }
        
        if (newName.includes('[APPROVED]')) {
          newName = newName.replace('[APPROVED]', '');
        }

        await db.execute(sql`
          UPDATE designs SET name = ${newName.trim()}, updated_at = NOW()
          WHERE id = ${item.design_id}
        `);
      }
    }

    const customerEmail = order.user_email;
    const customerName = order.customer_name || 'Customer';
    
    const firstDesign = itemsResult.rows.find((item: any) => item.design_id);
    let artworkPreviewUrl = '';
    if (firstDesign) {
      const designResult = await db.execute(sql`
        SELECT preview_url FROM designs WHERE id = ${(firstDesign as any).design_id}
      `);
      if (designResult.rows[0]) {
        artworkPreviewUrl = (designResult.rows[0] as any).preview_url || '';
      }
    }

    if (customerEmail) {
      await sendArtworkApprovalEmail({
        customerEmail,
        customerName,
        orderNumber: order.order_number,
        orderId,
        artworkPreviewUrl,
        isFlagged: true,
      });
    }

    await sendAdminNotificationEmail({
      type: 'issue_flagged',
      orderNumber: order.order_number,
      orderId,
      customerName,
      customerEmail,
      artworkPreviewUrl,
    });

    return NextResponse.json({ 
      message: "Issue flagged successfully. Customer has been notified to approve artwork." 
    });
  } catch (error) {
    console.error("Error flagging issue:", error);
    return NextResponse.json(
      { message: "Failed to flag issue" },
      { status: 500 }
    );
  }
}
