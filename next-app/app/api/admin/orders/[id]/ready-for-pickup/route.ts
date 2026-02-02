export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const PICKUP_ADDRESS = "2 N 35th Ave, Phoenix, AZ 85009";
const PICKUP_HOURS = "Monday - Friday, 9:00 AM - 5:00 PM";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.deliveryMethod !== "pickup") {
      return NextResponse.json(
        { message: "This order is not marked for pickup" },
        { status: 400 }
      );
    }

    await db.execute(sql`
      UPDATE orders 
      SET status = 'ready_for_pickup',
          pickup_ready_at = NOW(),
          pickup_instructions = ${`Pickup Location: ${PICKUP_ADDRESS}\nHours: ${PICKUP_HOURS}`}
      WHERE id = ${orderId}
    `);

    // Get customer email from multiple sources
    let customerEmail = order.customerEmail;
    let customerName = order.customerName || "Valued Customer";

    // Fallback 1: Try to get from user record
    if (!customerEmail && order.userId) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, order.userId))
        .limit(1);
      if (user) {
        customerEmail = user.email;
        customerName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || customerName;
      }
    }
    
    // Fallback 2: Parse from notes field
    if (!customerEmail && order.notes) {
      const emailMatch = order.notes.match(/Email:\s*(.+?)(?:\n|$)/);
      if (emailMatch) {
        customerEmail = emailMatch[1].trim();
      }
      if (!customerName || customerName === "Valued Customer") {
        const nameMatch = order.notes.match(/Customer:\s*(.+?)(?:\n|$)/);
        if (nameMatch) {
          customerName = nameMatch[1].trim();
        }
      }
    }
    
    console.log(`[Ready for Pickup] Order ${order.orderNumber} - email: ${customerEmail}, name: ${customerName}`);

    if (customerEmail) {
      const resendApiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.ORDER_EMAIL_FROM || "donotreply@stickybanditos.com";

      if (resendApiKey) {
        const siteUrl = process.env.SITE_URL || "http://localhost:5000";
        const orderLink = `${siteUrl}/orders/${orderId}`;

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
              <h2 style="color: #333;">Your Order is Ready for Pickup!</h2>
              <p style="color: #666; font-size: 16px;">
                Hi ${customerName},
              </p>
              <p style="color: #666; font-size: 16px;">
                Great news! Your order <strong>${order.orderNumber}</strong> is ready and waiting for you.
              </p>
              
              <div style="background-color: #fff; border: 2px solid #f97316; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #f97316; margin-top: 0;">Pickup Location</h3>
                <p style="color: #333; font-size: 16px; margin-bottom: 5px;">
                  <strong>${PICKUP_ADDRESS}</strong>
                </p>
                <p style="color: #666; font-size: 14px; margin-top: 5px;">
                  Hours: ${PICKUP_HOURS}
                </p>
              </div>
              
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  <strong>Please bring a valid ID when picking up your order.</strong>
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${orderLink}" style="background-color: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  View Order Details
                </a>
              </div>
              <p style="color: #999; font-size: 14px;">
                If you have any questions, please contact us at mhobbs.stickybanditos@gmail.com or call 602-554-5338.
              </p>
            </div>
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>Sticky Banditos Printing Company<br>${PICKUP_ADDRESS}</p>
            </div>
          </body>
          </html>
        `;

        try {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: fromEmail,
              to: customerEmail,
              subject: `Order ${order.orderNumber} - Ready for Pickup!`,
              html: emailHtml,
            }),
          });

          const emailResult = await emailResponse.json();
          if (!emailResponse.ok) {
            console.error("Resend API error:", emailResult);
          } else {
            console.log("Pickup ready email sent successfully:", emailResult.id);
          }
        } catch (emailError) {
          console.error("Failed to send pickup ready email:", emailError);
        }
      } else {
        console.log("RESEND_API_KEY not configured, skipping email");
      }
    }

    return NextResponse.json({
      message: "Order marked as ready for pickup",
      orderId,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Error marking order ready for pickup:", error);
    return NextResponse.json(
      { message: "Failed to mark order as ready for pickup" },
      { status: 500 }
    );
  }
}
