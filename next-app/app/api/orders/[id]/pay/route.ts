export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/shared/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomUUID } from "crypto";
import { sendOrderConfirmationEmail } from "@/lib/email/sendOrderConfirmationEmail";
import { sendAdminNotificationEmail } from "@/lib/email/sendNotificationEmails";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { sourceId } = body;

    if (!sourceId) {
      return NextResponse.json({ error: "Missing payment source" }, { status: 400 });
    }

    // Fetch the order
    const orderResult = await db.execute(sql`
      SELECT id, order_number, user_id, status, total_amount, subtotal, shipping_cost, tax_amount, 
             customer_email, shipping_address, notes
      FROM orders 
      WHERE id = ${orderId}
      LIMIT 1
    `);

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderRow = orderResult.rows[0] as any;

    // Authorization check: 
    // - Allow if user is admin
    // - Allow if user is authenticated and owns the order
    // - Allow if order has no user_id yet (admin-created order, first-time payment)
    const isAdmin = (session?.user as any)?.isAdmin === true;
    const userId = session?.user ? String((session.user as any).id) : null;
    const orderUserId = orderRow.user_id ? String(orderRow.user_id) : null;
    
    // If order has a user_id, only owner or admin can pay
    if (orderUserId && !isAdmin && orderUserId !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to pay for this order" },
        { status: 403 }
      );
    }

    // Check if order can be paid
    const payableStatuses = ["pending", "pending_payment", "awaiting_artwork"];
    if (!payableStatuses.includes(orderRow.status)) {
      return NextResponse.json(
        { error: "Order has already been paid or processed" },
        { status: 400 }
      );
    }
    
    // Link order to user if logged in and order has no user yet
    if (session?.user && !orderUserId) {
      await db.execute(sql`
        UPDATE orders SET user_id = ${userId} WHERE id = ${orderId}
      `);
    }

    // Get total amount
    const totalAmount = parseFloat(orderRow.total_amount || "0");
    
    // If total is $0, just mark as paid without Square
    if (totalAmount === 0) {
      await db.update(orders)
        .set({ status: "paid" })
        .where(eq(orders.id, orderId));

      return NextResponse.json({ 
        success: true, 
        orderId,
        message: "Order marked as paid (free order)"
      });
    }

    // Process payment with Square
    const amountInCents = Math.round(totalAmount * 100);
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

    if (!accessToken || !locationId) {
      return NextResponse.json(
        { error: "Payment processing is not configured" },
        { status: 500 }
      );
    }

    // Parse shipping address for billing
    let billingAddress: any = {};
    if (orderRow.shipping_address) {
      const addr = typeof orderRow.shipping_address === 'string' 
        ? JSON.parse(orderRow.shipping_address) 
        : orderRow.shipping_address;
      billingAddress = {
        first_name: addr.firstName || addr.name?.split(' ')[0] || '',
        last_name: addr.lastName || addr.name?.split(' ').slice(1).join(' ') || '',
        address_line_1: addr.address1 || addr.street || '',
        address_line_2: addr.address2 || '',
        locality: addr.city || '',
        administrative_district_level_1: addr.state || '',
        postal_code: addr.zip || '',
        country: addr.country || 'US',
      };
    }

    const paymentPayload = {
      source_id: sourceId,
      idempotency_key: randomUUID(),
      location_id: locationId,
      amount_money: {
        amount: amountInCents,
        currency: 'USD',
      },
      billing_address: billingAddress,
      note: `Order ${orderRow.order_number}`,
    };

    const response = await fetch('https://connect.squareup.com/v2/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-05-22',
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentResult = await response.json();
    const payment = paymentResult.payment;

    if (!payment || payment.status !== 'COMPLETED') {
      console.error('Square payment failed:', paymentResult);
      return NextResponse.json(
        { error: paymentResult?.errors?.[0]?.detail || 'Payment failed' },
        { status: 400 }
      );
    }

    // Update order status to paid
    await db.update(orders)
      .set({ 
        status: "paid",
        stripePaymentIntentId: payment.id,
      })
      .where(eq(orders.id, orderId));

    // Send confirmation email
    const customerEmail = orderRow.customer_email;
    if (customerEmail) {
      try {
        // Fetch order items for email
        const itemsResult = await db.execute(sql`
          SELECT oi.quantity, oi.unit_price, p.name as product_name
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ${orderId}
        `);
        
        const items = (itemsResult.rows || []).map((item: any) => ({
          name: item.product_name || 'Custom Product',
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price || '0'),
        }));

        const shippingAddr = typeof orderRow.shipping_address === 'string' 
          ? JSON.parse(orderRow.shipping_address) 
          : orderRow.shipping_address || {};

        await sendOrderConfirmationEmail({
          orderId,
          toEmail: customerEmail,
          orderNumber: orderRow.order_number,
          items,
          totals: {
            subtotal: parseFloat(orderRow.subtotal || '0'),
            shipping: parseFloat(orderRow.shipping_cost || '0'),
            tax: parseFloat(orderRow.tax_amount || '0'),
            total: totalAmount,
          },
          shippingAddress: {
            name: shippingAddr.name || `${shippingAddr.firstName || ''} ${shippingAddr.lastName || ''}`.trim(),
            address1: shippingAddr.address1 || shippingAddr.street || '',
            address2: shippingAddr.address2 || undefined,
            city: shippingAddr.city || '',
            state: shippingAddr.state || '',
            zip: shippingAddr.zip || '',
            country: shippingAddr.country || 'USA',
          },
        });
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
      }
    }

    // Notify admin
    const shippingAddr = typeof orderRow.shipping_address === 'string' 
      ? JSON.parse(orderRow.shipping_address) 
      : orderRow.shipping_address || {};
    
    sendAdminNotificationEmail({
      type: 'order_paid',
      orderNumber: orderRow.order_number,
      orderId,
      customerName: shippingAddr.name || 'Customer',
      customerEmail: customerEmail || undefined,
    }).catch(err => console.error('Failed to send admin notification:', err));

    return NextResponse.json({ 
      success: true, 
      orderId,
      message: "Payment successful! Your order is now being processed."
    });
  } catch (error) {
    console.error("Error processing order payment:", error);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
}
