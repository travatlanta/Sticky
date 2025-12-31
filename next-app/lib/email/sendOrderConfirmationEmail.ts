interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

interface SendEmailParams {
  toEmail: string;
  orderNumber: string;
  items: OrderItem[];
  totals: OrderTotals;
  shippingAddress: ShippingAddress;
}

export async function sendOrderConfirmationEmail({
  toEmail,
  orderNumber,
  items,
  totals,
  shippingAddress,
}: SendEmailParams): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.ORDER_EMAIL_FROM || 'Sticky Banditos <donotreply@stickybanditos.com>';
  const siteUrl = process.env.SITE_URL || 'https://stickybanditos.com';

  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured');
    return { ok: false, error: 'Email service not configured' };
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-family: Arial, sans-serif;">
          ${item.name}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; font-family: Arial, sans-serif;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-family: Arial, sans-serif;">
          ${formatCurrency(item.unitPrice)}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-family: Arial, sans-serif;">
          ${formatCurrency(item.unitPrice * item.quantity)}
        </td>
      </tr>
    `
    )
    .join('');

  const addressHtml = `
    ${shippingAddress.name}<br>
    ${shippingAddress.address1}<br>
    ${shippingAddress.address2 ? `${shippingAddress.address2}<br>` : ''}
    ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}<br>
    ${shippingAddress.country || 'USA'}
  `;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 24px; text-align: center;">
              <img src="${siteUrl}/logo.png" alt="Sticky Banditos" height="60" style="max-height: 60px;">
            </td>
          </tr>
          
          <!-- Order Confirmation Title -->
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: bold;">Order Confirmation</h1>
              <p style="margin: 8px 0 0 0; color: #666; font-size: 16px;">Thank you for your order!</p>
            </td>
          </tr>
          
          <!-- Order Number -->
          <tr>
            <td style="padding: 0 32px 24px 32px; text-align: center;">
              <div style="background-color: #f8f8f8; border-radius: 8px; padding: 16px; display: inline-block;">
                <span style="color: #666; font-size: 14px;">Order Number</span><br>
                <span style="color: #1a1a1a; font-size: 20px; font-weight: bold;">${orderNumber}</span>
              </div>
            </td>
          </tr>
          
          <!-- Order Items -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 18px; font-weight: bold; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px;">Order Items</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <th style="padding: 12px 0; border-bottom: 2px solid #333; text-align: left; font-family: Arial, sans-serif; font-size: 12px; text-transform: uppercase; color: #666;">Product</th>
                  <th style="padding: 12px 0; border-bottom: 2px solid #333; text-align: center; font-family: Arial, sans-serif; font-size: 12px; text-transform: uppercase; color: #666;">Qty</th>
                  <th style="padding: 12px 0; border-bottom: 2px solid #333; text-align: right; font-family: Arial, sans-serif; font-size: 12px; text-transform: uppercase; color: #666;">Price</th>
                  <th style="padding: 12px 0; border-bottom: 2px solid #333; text-align: right; font-family: Arial, sans-serif; font-size: 12px; text-transform: uppercase; color: #666;">Total</th>
                </tr>
                ${itemsHtml}
              </table>
            </td>
          </tr>
          
          <!-- Order Totals -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; font-family: Arial, sans-serif; color: #666;">Subtotal</td>
                  <td style="padding: 8px 0; text-align: right; font-family: Arial, sans-serif;">${formatCurrency(totals.subtotal)}</td>
                </tr>
                ${
                  totals.shipping > 0
                    ? `
                <tr>
                  <td style="padding: 8px 0; font-family: Arial, sans-serif; color: #666;">Expedited Shipping</td>
                  <td style="padding: 8px 0; text-align: right; font-family: Arial, sans-serif;">${formatCurrency(totals.shipping)}</td>
                </tr>
                `
                    : ''
                }
                ${
                  totals.tax > 0
                    ? `
                <tr>
                  <td style="padding: 8px 0; font-family: Arial, sans-serif; color: #666;">Tax</td>
                  <td style="padding: 8px 0; text-align: right; font-family: Arial, sans-serif;">${formatCurrency(totals.tax)}</td>
                </tr>
                `
                    : ''
                }
                <tr>
                  <td style="padding: 16px 0 8px 0; font-family: Arial, sans-serif; font-weight: bold; font-size: 18px; border-top: 2px solid #333;">Grand Total</td>
                  <td style="padding: 16px 0 8px 0; text-align: right; font-family: Arial, sans-serif; font-weight: bold; font-size: 18px; border-top: 2px solid #333;">${formatCurrency(totals.total)}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 18px; font-weight: bold; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px;">Shipping Address</h2>
              <p style="margin: 0; color: #333; line-height: 1.6; font-family: Arial, sans-serif;">
                ${addressHtml}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 24px 32px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px; font-family: Arial, sans-serif;">
                Questions about your order? Contact us at<br>
                <a href="mailto:mhobbs.stickybanditos@gmail.com" style="color: #1a1a1a;">mhobbs.stickybanditos@gmail.com</a>
              </p>
              <p style="margin: 16px 0 0 0; color: #999; font-size: 12px; font-family: Arial, sans-serif;">
                Sticky Banditos Printing Company<br>
                2 North 35th Ave, Phoenix, AZ 85009<br>
                <a href="tel:602-554-5338" style="color: #999;">602-554-5338</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `Order Confirmation – ${orderNumber}`,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Resend API error:', response.status, errorData);
      return { ok: false, error: `Email API error: ${response.status}` };
    }

    const result = await response.json();
    console.log('Order confirmation email sent successfully:', result.id);
    return { ok: true };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return { ok: false, error: String(error) };
  }
}
