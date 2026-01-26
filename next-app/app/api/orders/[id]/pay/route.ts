export const dynamic = "force-dynamic";
export const revalidate = 0;
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
    console.log(`[Pay API] DEPLOY VERSION: 2026-01-26-v3 - with fallback handling`);
    
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

    // Fetch the order - using only columns that exist in production
    let orderResult;
    try {
      orderResult = await db.execute(sql`
        SELECT id, order_number, user_id, status, total_amount, subtotal, shipping_cost, tax_amount, 
               customer_email, shipping_address, notes, created_by_admin_id
        FROM orders 
        WHERE id = ${orderId}
        LIMIT 1
      `);
    } catch (colError: any) {
      // created_by_admin_id might not exist in production
      console.log('[Pay API] Fallback query without created_by_admin_id');
      orderResult = await db.execute(sql`
        SELECT id, order_number, user_id, status, total_amount, subtotal, shipping_cost, tax_amount, 
               customer_email, shipping_address, notes
        FROM orders 
        WHERE id = ${orderId}
        LIMIT 1
      `);
    }

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderRow = orderResult.rows[0] as any;

    // Authorization check: 
    // - Allow if user is admin
    // - Allow if user is authenticated and owns the order
    // - Allow if order has no user_id yet (admin-created order, first-time payment)
    // - Allow if order was created by admin (payment link access)
    // - Allow if notes contain "Payment Link:" (admin-created order indicator)
    const isAdmin = (session?.user as any)?.isAdmin === true;
    const userId = session?.user ? String((session.user as any).id) : null;
    const orderUserId = orderRow.user_id ? String(orderRow.user_id) : null;
    // Check both column and notes for admin-created orders
    const isAdminCreatedOrder = !!orderRow.created_by_admin_id || (orderRow.notes && orderRow.notes.includes('Payment Link:'));
    
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
        // Simple status update - no complex columns
        await db.execute(sql`UPDATE orders SET status = 'paid' WHERE id = ${orderId}`);
        console.log(`[Pay API] Order ${orderId} status updated to 'paid' (free order)`);
      } catch (updateError) {
        console.error(`[Pay API] Failed to update order ${orderId} status:`, updateError);
        return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
      }

      // Update customer notification for free order
      if (orderUserId || userId) {
        const notifyUserId = orderUserId || userId;
        try {
          const updateResult = await db.execute(sql`
            UPDATE notifications 
            SET title = ${'Order Confirmed - #' + orderRow.order_number},
                message = ${'Your order has been confirmed and is now being processed!'},
                type = 'order',
                is_read = false
            WHERE order_id = ${orderId} AND user_id = ${notifyUserId}
            RETURNING id
          `);
          
          if (!updateResult.rows || updateResult.rows.length === 0) {
            await db.execute(sql`
              INSERT INTO notifications (user_id, type, title, message, order_id, link_url, is_read, created_at)
              VALUES (
                ${notifyUserId},
                'order',
                ${'Order Confirmed - #' + orderRow.order_number},
                ${'Your order has been confirmed and is now being processed!'},
                ${orderId},
                ${'/orders/' + orderId},
                false,
                NOW()
              )
            `);
          }
        } catch (notifError) {
          console.error('[Pay API] Failed to update notification for free order:', notifError);
        }
      }

      return NextResponse.json({ 
        success: true, 
        orderId,
        message: "Order marked as paid (free order)"
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache'
        }
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

    // Update order status to paid - SIMPLE AND RELIABLE
    console.log(`[Pay API] Order ${orderId} payment completed. Square payment ID: ${payment.id}`);
    try {
      // Simple update with payment ID - no complex columns
      await db.execute(sql`
        UPDATE orders 
        SET status = 'paid', stripe_payment_intent_id = ${payment.id}
        WHERE id = ${orderId}
      `);
      console.log(`[Pay API] Order ${orderId} status updated to 'paid' with payment ID`);
    } catch (updateError: any) {
      console.error(`[Pay API] CRITICAL: Failed to update order ${orderId}:`, updateError.message);
      // Last resort - just update status without payment ID
      try {
        await db.execute(sql`UPDATE orders SET status = 'paid' WHERE id = ${orderId}`);
        console.log(`[Pay API] Order ${orderId} status updated to 'paid' (fallback)`);
      } catch (fallbackError: any) {
        console.error(`[Pay API] CRITICAL: Even simple update failed:`, fallbackError.message);
        // Payment succeeded with Square but DB update failed - still return success
        // to avoid double-charging. Log this for manual intervention.
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

    // Update or create customer notification to show payment completed
    if (orderUserId || userId) {
      const notifyUserId = orderUserId || userId;
      try {
        // First try to update existing notification for this order
        const updateResult = await db.execute(sql`
          UPDATE notifications 
          SET title = ${'Payment Complete - Order #' + orderRow.order_number},
              message = ${'Your payment has been received. Your order is now being processed!'},
              type = 'order',
              is_read = false
          WHERE order_id = ${orderId} AND user_id = ${notifyUserId}
          RETURNING id
        `);
        
        // If no existing notification was updated, create a new one
        if (!updateResult.rows || updateResult.rows.length === 0) {
          await db.execute(sql`
            INSERT INTO notifications (user_id, type, title, message, order_id, link_url, is_read, created_at)
            VALUES (
              ${notifyUserId},
              'order',
              ${'Payment Complete - Order #' + orderRow.order_number},
              ${'Your payment has been received. Your order is now being processed!'},
              ${orderId},
              ${'/orders/' + orderId},
              false,
              NOW()
            )
          `);
        }
        console.log(`[Pay API] Updated notification for order ${orderId}`);
      } catch (notifError) {
        console.error('[Pay API] Failed to update notification:', notifError);
        // Don't fail the payment for notification issues
      }
    }

    return NextResponse.json({ 
      success: true, 
      orderId,
      message: "Payment successful! Your order is now being processed."
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      }
    });
  } catch (error: any) {
    console.error("Error processing order payment:", error);
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: "Payment processing failed",
        details: error?.message || String(error),
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
