export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, users, notifications, products } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";
import { z } from "zod";
import { generateEmailHtml } from "@/lib/email/template";

function generateOrderNumber(): string {
  const prefix = "SB";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

function generatePaymentToken(): string {
  return randomBytes(32).toString("hex");
}

const createOrderSchema = z.object({
  customer: z.object({
    userId: z.string().nullable(),
    email: z.string().email(),
    name: z.string().min(1),
    phone: z.string().optional(),
    isNewCustomer: z.boolean(),
  }),
  shippingAddress: z.object({
    name: z.string(),
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
      selectedOptions: z.record(z.string()),
    })
  ).min(1),
  subtotal: z.number().min(0),
  shippingCost: z.number().min(0),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = createOrderSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return NextResponse.json({ message: `Validation failed: ${errors}` }, { status: 400 });
    }

    const data = parseResult.data;
    const orderNumber = generateOrderNumber();
    const paymentLinkToken = generatePaymentToken();

    let customerId = data.customer.userId;

    if (!customerId && data.customer.email) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.customer.email))
        .limit(1);

      if (existingUser) {
        customerId = existingUser.id;
      }
    }

    let newOrder;
    
    // Use only core columns that definitely exist in all database versions
    // Store customer info and payment token in the notes field as backup
    const notesContent = [
      `Customer: ${data.customer.name}`,
      `Email: ${data.customer.email}`,
      data.customer.phone ? `Phone: ${data.customer.phone}` : null,
      `Payment Link: ${paymentLinkToken}`,
      data.notes ? `Admin Notes: ${data.notes}` : null,
    ].filter(Boolean).join('\n');
    
    try {
      // Use raw SQL to bypass Drizzle ORM schema validation
      // This ensures we only use columns that exist in production database
      const shippingAddressJson = JSON.stringify(data.shippingAddress);
      
      const result = await db.execute(sql`
        INSERT INTO orders (
          order_number,
          user_id,
          status,
          subtotal,
          shipping_cost,
          tax_amount,
          discount_amount,
          total_amount,
          shipping_address,
          notes
        ) VALUES (
          ${orderNumber},
          ${customerId},
          'pending',
          ${data.subtotal.toFixed(2)},
          ${data.shippingCost.toFixed(2)},
          ${data.taxAmount.toFixed(2)},
          ${data.discountAmount.toFixed(2)},
          ${data.totalAmount.toFixed(2)},
          ${shippingAddressJson}::jsonb,
          ${notesContent}
        )
        RETURNING id, order_number, status, total_amount
      `);
      
      newOrder = {
        id: result.rows[0].id as number,
        orderNumber: result.rows[0].order_number as string,
        status: result.rows[0].status as string,
        totalAmount: result.rows[0].total_amount as string,
      };
    } catch (dbError: any) {
      console.error("Order creation failed:", dbError.message);
      return NextResponse.json({ 
        message: `Failed to create order: ${dbError.message || 'Database error'}` 
      }, { status: 500 });
    }

    for (const item of data.items) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        selectedOptions: item.selectedOptions,
      });
    }

    if (customerId) {
      await db.insert(notifications).values({
        userId: customerId,
        type: "payment_required",
        title: "New Order Awaiting Payment",
        message: `Order ${orderNumber} has been created for you. Please complete payment to proceed.`,
        orderId: newOrder.id,
        linkUrl: `/pay/${paymentLinkToken}`,
      });
    }

    const siteUrl = process.env.SITE_URL || "http://localhost:5000";
    const paymentLink = `${siteUrl}/pay/${paymentLinkToken}`;

    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.ORDER_EMAIL_FROM || "donotreply@stickybanditos.com";

      if (resendApiKey) {
        const emailHtml = generateEmailHtml({
          preheaderText: `Complete payment for order ${orderNumber}`,
          headline: "Your Order is Ready for Payment",
          subheadline: `Order #${orderNumber}`,
          greeting: `Hi ${data.customer.name},`,
          bodyContent: `
            <p>An order has been created for you by our team at Sticky Banditos!</p>
            
            <div style="background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 8px; padding: 16px; margin: 16px 0;">
              <table width="100%" style="border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">Order Number:</td>
                  <td style="padding: 8px 0; color: #f97316; font-weight: 700; text-align: right;">${orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.1); color: #9ca3af; font-size: 14px;">Order Total:</td>
                  <td style="padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.1); color: #22c55e; font-weight: 700; font-size: 18px; text-align: right;">$${data.totalAmount.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <p style="margin-top: 16px;">Click the button below to complete your payment and get your order started!</p>
          `,
          ctaButton: {
            text: "Complete Payment",
            url: paymentLink,
            color: "orange",
          },
          customFooterNote: "This payment link is unique to your order. Please do not share it with others.",
        });

        console.log(`Sending order email to ${data.customer.email} from ${fromEmail}`);
        
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: data.customer.email,
            subject: `Order ${orderNumber} - Complete Your Payment`,
            html: emailHtml,
          }),
        });

        const emailResult = await emailResponse.json();
        if (!emailResponse.ok) {
          console.error("Resend API error:", emailResult);
        } else {
          console.log("Email sent successfully:", emailResult.id);
        }
      } else {
        console.log("RESEND_API_KEY not configured, skipping email");
      }
    } catch (emailError) {
      console.error("Failed to send payment email:", emailError);
    }

    return NextResponse.json({
      id: newOrder.id,
      orderNumber: newOrder.orderNumber,
      paymentLink,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ message: "Failed to create order" }, { status: 500 });
  }
}
