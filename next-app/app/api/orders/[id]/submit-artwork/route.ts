export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateEmailHtml } from "@/lib/email/template";

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

        const emailHtml = generateEmailHtml({
          preheaderText: `New artwork submitted for order ${order.order_number}`,
          headline: "New Artwork Submitted",
          subheadline: `Order #${order.order_number}`,
          bodyContent: `
            <p><strong style="color: #f97316;">${customerName}</strong> has submitted artwork for review.</p>
            
            <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 16px; margin: 16px 0;">
              <table width="100%" style="border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">Customer:</td>
                  <td style="padding: 8px 0; color: #ffffff; font-weight: 600; text-align: right;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.1); color: #9ca3af; font-size: 14px;">Files Uploaded:</td>
                  <td style="padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.1); color: #22c55e; font-weight: 700; text-align: right;">${itemsWithArtwork.length} file(s)</td>
                </tr>
              </table>
            </div>
            
            <p>The artwork is ready for your review in the admin panel.</p>
          `,
          ctaButton: {
            text: "Review Artwork",
            url: adminOrderUrl,
            color: "green",
          },
          showSocialLinks: false,
        });

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
