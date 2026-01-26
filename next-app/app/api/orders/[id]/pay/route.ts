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
    
    console.log(`[Pay API] ====== Payment request for order ${id} ======`);
    
    if (isNaN(orderId)) {
      console.log(`[Pay API] REJECTED - Invalid order ID: ${id}`);
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.log(`[Pay API] REJECTED - Failed to parse request body:`, parseError);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    const { sourceId, billingAddress: clientBillingAddress } = body;
    console.log(`[Pay API] Order ${orderId} - sourceId: ${sourceId}, hasSession: ${!!session}`);

    // sourceId can be "FREE_ORDER" for $0 orders or a Square token for paid orders
    if (!sourceId) {
      console.log(`[Pay API] REJECTED - Missing sourceId for order ${orderId}`);
      return NextResponse.json({ error: "Missing payment source" }, { status: 400 });
    }

    // Fetch the order
    const orderResult = await db.execute(sql`
      SELECT id, order_number, user_id, status, total_amount, subtotal, shipping_cost, tax_amount, 
             customer_email, shipping_address, notes, created_by_admin_id
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
    // - Allow if order was created by admin (payment link access)
    const isAdmin = (session?.user as any)?.isAdmin === true;
    const userId = session?.user ? String((session.user as any).id) : null;
    const orderUserId = orderRow.user_id ? String(orderRow.user_id) : null;
    const isAdminCreatedOrder = !!orderRow.created_by_admin_id;
    
    console.log(`[Pay API] Order ${orderId} auth check:`, {
      isAdmin,
      userId,
      orderUserId,
      isAdminCreatedOrder,
      hasSession: !!session
    });
    
    // For admin-created orders (payment link), allow anyone with the link to pay
    // For customer-created orders, only owner or admin can pay
    if (!isAdminCreatedOrder && orderUserId && !isAdmin && orderUserId !== userId) {
      console.log(`[Pay API] Order ${orderId} REJECTED - unauthorized (not owner, not admin, not admin-created)`);
      return NextResponse.json(
        { error: "You are not authorized to pay for this order" },
        { status: 403 }
      );
    }

    // Check if order can be paid
    const payableStatuses = ["pending", "pending_payment", "awaiting_artwork"];
    console.log(`[Pay API] Order ${orderId} status check:`, {
      currentStatus: orderRow.status,
      payableStatuses,
      isPayable: payableStatuses.includes(orderRow.status),
      totalAmount: orderRow.total_amount,
      userId: userId,
      orderUserId: orderUserId,
      isAdmin
    });
    
    if (!payableStatuses.includes(orderRow.status)) {
      console.log(`[Pay API] Order ${orderId} REJECTED - status '${orderRow.status}' not in payable list`);
      return NextResponse.json(
        { error: `Order has already been paid or processed (status: ${orderRow.status})` },
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
      console.log(`[Pay API] Order ${orderId} is $0 - marking as paid without Square`);
      
      try {
        // Try to update with payment_confirmed_at, fall back to just status if column doesn't exist
        try {
          await db.execute(sql`
            UPDATE orders 
            SET status = 'paid', 
                payment_confirmed_at = NOW(),
                updated_at = NOW()
            WHERE id = ${orderId}
          `);
          console.log(`[Pay API] Order ${orderId} status updated to 'paid' with payment_confirmed_at (free order)`);
        } catch (colError: any) {
          // Column might not exist in production, fall back to simpler update
          console.log(`[Pay API] payment_confirmed_at column might not exist, using simple update`);
          await db.execute(sql`UPDATE orders SET status = 'paid' WHERE id = ${orderId}`);
          console.log(`[Pay API] Order ${orderId} status updated to 'paid' (free order, simple update)`);
        }
      } catch (updateError) {
        console.error(`[Pay API] Failed to update order ${orderId} status:`, updateError);
        return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
      }

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

    // Parse billing address from client request or fall back to shipping address
    let billingAddress: any = {};
    const billingSource = clientBillingAddress || 
      (orderRow.shipping_address 
        ? (typeof orderRow.shipping_address === 'string' 
            ? JSON.parse(orderRow.shipping_address) 
            : orderRow.shipping_address)
        : null);
    
    if (billingSource) {
      billingAddress = {
        first_name: billingSource.firstName || billingSource.name?.split(' ')[0] || '',
        last_name: billingSource.lastName || billingSource.name?.split(' ').slice(1).join(' ') || '',
        address_line_1: billingSource.address1 || billingSource.street || '',
        address_line_2: billingSource.address2 || billingSource.street2 || '',
        locality: billingSource.city || '',
        administrative_district_level_1: billingSource.state || '',
        postal_code: billingSource.zip || '',
        country: billingSource.country || 'US',
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
    console.log(`[Pay API] Order ${orderId} payment completed. Square payment ID: ${payment.id}`);
    try {
      // Try with payment_confirmed_at first
      try {
        await db.execute(sql`
          UPDATE orders 
          SET status = 'paid', 
              stripe_payment_intent_id = ${payment.id},
              payment_confirmed_at = NOW(),
              updated_at = NOW()
          WHERE id = ${orderId}
        `);
        console.log(`[Pay API] Order ${orderId} status successfully updated to 'paid' with payment_confirmed_at`);
      } catch (colError: any) {
        // Column might not exist, try without it
        console.log(`[Pay API] payment_confirmed_at might not exist, trying simpler update`);
        await db.execute(sql`
          UPDATE orders 
          SET status = 'paid', stripe_payment_intent_id = ${payment.id}
          WHERE id = ${orderId}
        `);
        console.log(`[Pay API] Order ${orderId} status updated to 'paid' (without payment_confirmed_at)`);
      }
    } catch (updateError: any) {
      console.error(`[Pay API] CRITICAL: Failed to update order ${orderId} status to paid:`, updateError.message);
      // Last resort - just update status
      try {
        await db.execute(sql`UPDATE orders SET status = 'paid' WHERE id = ${orderId}`);
        console.log(`[Pay API] Order ${orderId} status updated to 'paid' (minimal fallback)`);
      } catch (fallbackError: any) {
        console.error(`[Pay API] CRITICAL: Even simple status update failed for order ${orderId}:`, fallbackError.message);
      }
    }

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
