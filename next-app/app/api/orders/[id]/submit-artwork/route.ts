export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const orderId = parseInt(params.id);
    const userId = (session.user as any).id;

    const orderResult = await db.execute(sql`
      SELECT id, order_number, user_id, notes
      FROM orders 
      WHERE id = ${orderId}
      LIMIT 1
    `);

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0] as any;

    if (order.user_id !== userId && !(session.user as any).isAdmin) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    const itemsResult = await db.execute(sql`
      SELECT oi.id, d.id as design_id, d.name as design_name, d.preview_url
      FROM order_items oi
      LEFT JOIN designs d ON oi.design_id = d.id
      WHERE oi.order_id = ${orderId}
    `);

    const items = itemsResult.rows || [];
    const itemsWithArtwork = items.filter((item: any) => item.design_id && item.preview_url);

    if (itemsWithArtwork.length === 0) {
      return NextResponse.json({ 
        message: "No artwork uploaded. Please upload artwork first." 
      }, { status: 400 });
    }

    const customerName = session.user.name || "Customer";
    const customerEmail = session.user.email || "";

    const adminsResult = await db.execute(sql`
      SELECT id FROM users WHERE is_admin = true LIMIT 5
    `);

    const adminIds = (adminsResult.rows || []).map((r: any) => r.id);

    for (const adminId of adminIds) {
      try {
        await db.execute(sql`
          INSERT INTO notifications (user_id, type, title, message, data, read, created_at)
          VALUES (
            ${adminId},
            'artwork_submitted',
            ${'Artwork Submitted - Order #' + order.order_number},
            ${customerName + ' has submitted artwork for order #' + order.order_number + '. ' + itemsWithArtwork.length + ' file(s) uploaded.'},
            ${JSON.stringify({ orderId: order.id, orderNumber: order.order_number, itemCount: itemsWithArtwork.length })}::jsonb,
            false,
            NOW()
          )
        `);
      } catch (notifError) {
        console.error("Failed to create notification for admin:", adminId, notifError);
      }
    }

    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      const adminEmail = process.env.ADMIN_EMAIL || "mhobbs.stickybanditos@gmail.com";
      const fromEmail = "donotreply@stickybanditos.com";

      if (resendApiKey) {
        const siteUrl = process.env.SITE_URL || "https://stickybanditos.com";
        const adminOrderUrl = `${siteUrl}/admin/orders`;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Sticky Banditos</h1>
            </div>
            <div style="padding: 30px 20px; background-color: #f9f9f9;">
              <h2 style="color: #333;">Artwork Submitted</h2>
              <p style="color: #666; font-size: 16px;">
                <strong>${customerName}</strong> has submitted artwork for <strong>Order #${order.order_number}</strong>.
              </p>
              <p style="color: #666; font-size: 16px;">
                ${itemsWithArtwork.length} file(s) have been uploaded and are ready for review.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${adminOrderUrl}" style="background-color: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Review Artwork
                </a>
              </div>
            </div>
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>Sticky Banditos Printing Company<br>2 North 35th Ave, Phoenix, AZ 85009</p>
            </div>
          </body>
          </html>
        `;

        console.log(`Sending artwork notification email to ${adminEmail}`);

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: adminEmail,
            subject: `Artwork Submitted - Order #${order.order_number}`,
            html: emailHtml,
          }),
        });

        const emailResult = await emailResponse.json();
        if (!emailResponse.ok) {
          console.error("Resend API error:", emailResult);
        } else {
          console.log("Artwork notification email sent:", emailResult.id);
        }
      }
    } catch (emailError) {
      console.error("Failed to send artwork notification email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Artwork submitted successfully! We'll review it and get back to you soon.",
    });
  } catch (error) {
    console.error("Error submitting artwork:", error);
    return NextResponse.json({ message: "Failed to submit artwork" }, { status: 500 });
  }
}
