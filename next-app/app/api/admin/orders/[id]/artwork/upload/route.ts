export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { designs } from "@shared/schema";
import { sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import { sendEmail } from "@/lib/email";
import { generateEmailHtml } from "@/lib/email/template";

// Parse customer info from notes field
function parseNotesForCustomerInfo(notes: string | null): { name?: string; email?: string; phone?: string } {
  if (!notes) return {};
  const result: { name?: string; email?: string; phone?: string } = {};
  
  const nameMatch = notes.match(/Customer:\s*(.+?)(?:\n|$)/);
  if (nameMatch) result.name = nameMatch[1].trim();
  
  const emailMatch = notes.match(/Email:\s*(.+?)(?:\n|$)/);
  if (emailMatch) result.email = emailMatch[1].trim();
  
  const phoneMatch = notes.match(/Phone:\s*(.+?)(?:\n|$)/);
  if (phoneMatch) result.phone = phoneMatch[1].trim();
  
  return result;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
    }

    // Use raw SQL to fetch order - production safe
    const orderResult = await db.execute(sql`
      SELECT id, order_number, user_id, notes FROM orders WHERE id = ${orderId}
    `);
    
    const order = orderResult.rows?.[0] as any;
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const notes = formData.get("notes") as string;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".eps", ".ai", ".psd", ".cdr"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ 
        message: "Invalid file type. Allowed: JPG, PNG, GIF, WebP, PDF, EPS, AI, PSD, CDR" 
      }, { status: 400 });
    }

    const filename = `admin-designs/order-${orderId}-${Date.now()}${ext}`;
    
    const blob = await put(filename, file, {
      access: "public",
    });

    // Ensure order_designs table exists for tracking
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS order_designs (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          design_id INTEGER NOT NULL,
          status VARCHAR(50) DEFAULT 'pending_approval',
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
    } catch (e) {
      // Table might already exist
    }

    // Create design record
    const [design] = await db.insert(designs).values({
      userId: (session.user as any).id,
      name: `Design for Order #${order.order_number}`,
      previewUrl: blob.url,
      highResExportUrl: blob.url,
      status: "submitted",
    }).returning();

    // Link design to order via order_designs table
    await db.execute(sql`
      INSERT INTO order_designs (order_id, design_id, status, notes)
      VALUES (${orderId}, ${design.id}, 'pending_approval', ${notes || null})
    `);

    // Get customer email - from user or from notes
    let customerEmail: string | undefined;
    let customerName: string | undefined;
    
    if (order.user_id) {
      const userResult = await db.execute(sql`
        SELECT email, first_name, last_name FROM users WHERE id = ${order.user_id}
      `);
      const user = userResult.rows?.[0] as any;
      if (user) {
        customerEmail = user.email;
        customerName = user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.first_name;
      }
    }
    
    // Try parsing from notes for guest orders
    if (!customerEmail && order.notes) {
      const customerInfo = parseNotesForCustomerInfo(order.notes);
      customerEmail = customerInfo.email;
      customerName = customerInfo.name;
    }

    // Create a notification if user exists
    if (order.user_id) {
      try {
        await db.execute(sql`
          INSERT INTO notifications (user_id, type, title, message, order_id, link_url)
          VALUES (
            ${order.user_id}, 
            'artwork_pending_approval', 
            'Design Ready for Review',
            ${'Your design for order #' + order.order_number + ' is ready. Please review and approve.'},
            ${orderId},
            ${'/orders/' + orderId + '/artwork'}
          )
        `);
      } catch (e) {
        // Notification table might not exist
      }
    }

    // Send email notification to customer
    if (customerEmail) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_URL || 'https://stickybanditos.com';
        
        const emailHtml = generateEmailHtml({
          preheaderText: `Your design for Order #${order.order_number} is ready for approval`,
          headline: 'Your Design is Ready for Review!',
          subheadline: `Order #${order.order_number}`,
          greeting: `Hi ${customerName || 'Valued Customer'},`,
          bodyContent: `
            <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
              Great news! We've prepared a design for your sticker order and it's ready for your review.
            </p>
            ${notes ? `
            <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 16px 0; border-left: 4px solid #f97316;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #374151;">Notes from our team:</p>
              <p style="margin: 0; color: #6b7280; font-style: italic;">${notes}</p>
            </div>
            ` : ''}
            <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
              Please click the button below to view your design and let us know if it's approved or if you need any changes.
            </p>
          `,
          ctaButton: {
            text: 'Review & Approve Design',
            url: `${baseUrl}/orders/${orderId}`,
            color: 'orange',
          },
          showSocialLinks: true,
          customFooterNote: 'Please review and approve your design so we can begin printing your stickers!',
        });

        await sendEmail({
          to: customerEmail,
          subject: `Your Design is Ready for Approval - Order #${order.order_number}`,
          html: emailHtml,
        });

        console.log(`Design approval email sent to ${customerEmail} for order ${order.order_number}`);
      } catch (emailError) {
        console.error("Error sending design approval email:", emailError);
      }
    }

    return NextResponse.json({ 
      success: true,
      designId: design.id,
      message: "Design uploaded and sent for customer approval"
    });
  } catch (error) {
    console.error("Error uploading admin design:", error);
    return NextResponse.json({ message: "Failed to upload design" }, { status: 500 });
  }
}
