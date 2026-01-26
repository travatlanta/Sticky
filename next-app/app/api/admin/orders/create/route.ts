export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, users, notifications, products } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendAdminNotificationEmail } from "@/lib/email/sendNotificationEmails";
import { randomBytes } from "crypto";
import { z } from "zod";

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
  // Manual orders can be for phone/in-person; allow shipping address
  // to be omitted or partially filled.
  shippingAddress: z
    .object({
      name: z.string().optional(),
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  items: z.array(
    z.object({
      // Custom items may not map to a catalog product.
      productId: z.number().nullable(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
      selectedOptions: z.record(z.any()).default({}),
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
      const shippingAddressJson = data.shippingAddress
        ? JSON.stringify(data.shippingAddress)
        : null;
      const adminId = (session.user as any).id;
      
      // Try with artwork_status and created_by_admin_id columns first
      let result;
      try {
        result = await db.execute(sql`
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
            notes,
            artwork_status,
            created_by_admin_id
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
            ${notesContent},
            'awaiting_artwork',
            ${adminId}
          )
          RETURNING id, order_number, status, total_amount
        `);
      } catch (colErr) {
        // Fallback without new columns (production may not have them)
        console.log('Falling back to order creation without artwork_status/created_by_admin_id columns');
        result = await db.execute(sql`
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
      }
      
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
      // Skip items without a valid productId (custom items not in catalog)
      if (item.productId === null) {
        console.log('[Admin Order] Skipping item without productId');
        continue;
      }
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
        linkUrl: `/orders/${newOrder.id}`,
      });
    }

    const siteUrl = process.env.SITE_URL || "http://localhost:5000";
    const orderLink = `${siteUrl}/orders/${newOrder.id}`;

    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.ORDER_EMAIL_FROM || "donotreply@stickybanditos.com";

      if (resendApiKey) {
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
              <h2 style="color: #333;">Your Order is Ready for Payment</h2>
              <p style="color: #666; font-size: 16px;">
                Hi ${data.customer.name},
              </p>
              <p style="color: #666; font-size: 16px;">
                An order has been created for you. Your order number is <strong>${orderNumber}</strong>.
              </p>
              <p style="color: #666; font-size: 16px;">
                <strong>Order Total: $${data.totalAmount.toFixed(2)}</strong>
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${orderLink}" style="background-color: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  View Order & Complete Payment
                </a>
              </div>
              <p style="color: #999; font-size: 14px;">
                If you have any questions, please contact us at mhobbs.stickybanditos@gmail.com or call 602-554-5338.
              </p>
            </div>
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>Sticky Banditos Printing Company<br>2 North 35th Ave, Phoenix, AZ 85009</p>
            </div>
          </body>
          </html>
        `;

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

    // Notify main admin of newly created manual order (in addition to automated checkout flow notifications)
    try {
      await sendAdminNotificationEmail({
        type: "new_order",
        orderNumber,
        customerName: data.customer.name,
        customerEmail: data.customer.email,
        totalAmount: data.totalAmount,
        items: data.items.map((i) => ({
          productName: i.productName || "Custom Order",
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          selectedOptions: i.selectedOptions || {},
        })),
        orderId: newOrder.id,
      });
    } catch (adminEmailError) {
      console.error("Failed to send admin new-order notification:", adminEmailError);
    }

    return NextResponse.json({
      id: newOrder.id,
      orderNumber: newOrder.orderNumber,
      orderLink,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ message: "Failed to create order" }, { status: 500 });
  }
}
