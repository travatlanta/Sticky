const ADMIN_EMAIL = 'mhobbs.stickybanditos@gmail.com';
const FROM_EMAIL = process.env.ORDER_EMAIL_FROM || 'Sticky Banditos <donotreply@stickybanditos.com>';
const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://stickybanditos.com';

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured - emails will not be sent');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

interface ArtworkApprovalEmailParams {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderId: number;
  artworkPreviewUrl: string;
  isFlagged?: boolean;
}

export async function sendArtworkApprovalEmail(params: ArtworkApprovalEmailParams): Promise<boolean> {
  const { customerEmail, customerName, orderNumber, orderId, artworkPreviewUrl, isFlagged } = params;
  const orderUrl = `${SITE_URL}/orders/${orderId}`;

  const subject = isFlagged 
    ? `Action Required: Artwork Updated for Order #${orderNumber}`
    : `Action Required: Please Approve Your Design for Order #${orderNumber}`;

  const headline = isFlagged
    ? "We've Made Adjustments to Your Artwork"
    : "Your Custom Design is Ready for Review";

  const message = isFlagged
    ? "We noticed an issue with your artwork and made some adjustments. Please review the updated design below and approve it so we can proceed with printing."
    : "We've prepared your custom design and it's ready for your approval. Please review the design below and click the button to approve it.";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #1a1a1a; padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Sticky Banditos</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px;">
        <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 20px;">${headline}</h2>
        <p style="margin: 0 0 8px; color: #666; font-size: 14px;">Hi ${customerName || 'there'},</p>
        <p style="margin: 0 0 24px; color: #666; font-size: 14px;">${message}</p>
        
        <div style="text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 12px; color: #333; font-weight: 600;">Order #${orderNumber}</p>
          ${artworkPreviewUrl ? `
          <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; background-color: #fafafa;">
            <img src="${artworkPreviewUrl}" alt="Your Design" style="max-width: 100%; max-height: 300px; border-radius: 4px;">
          </div>
          ` : ''}
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${orderUrl}" style="display: inline-block; background-color: #22c55e; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Review & Approve Design
          </a>
        </div>

        <p style="margin: 24px 0 0; color: #999; font-size: 12px; text-align: center;">
          If you have any questions, please contact us at ${ADMIN_EMAIL} or call 602-554-5338
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f5f5f5; padding: 16px; text-align: center;">
        <p style="margin: 0; color: #999; font-size: 12px;">
          Sticky Banditos Printing Company<br>
          2 North 35th Ave, Phoenix, AZ 85009
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const success = await sendEmail(customerEmail, subject, html);
  if (success) {
    console.log(`Artwork approval email sent to ${customerEmail} for order ${orderNumber}`);
  }
  return success;
}

interface AdminNotificationParams {
  type: 'new_order' | 'design_submitted' | 'artwork_approved' | 'issue_flagged';
  orderNumber: string;
  orderId: number;
  customerName?: string;
  customerEmail?: string;
  artworkPreviewUrl?: string;
}

export async function sendAdminNotificationEmail(params: AdminNotificationParams): Promise<boolean> {
  const { type, orderNumber, orderId, customerName, customerEmail, artworkPreviewUrl } = params;
  const orderUrl = `${SITE_URL}/admin/orders?id=${orderId}`;

  let subject: string;
  let headline: string;
  let message: string;
  let actionLabel: string;

  switch (type) {
    case 'new_order':
      subject = `New Order #${orderNumber} Received`;
      headline = 'New Order Received!';
      message = `A new order has been placed by ${customerName || 'a customer'}${customerEmail ? ` (${customerEmail})` : ''}.`;
      actionLabel = 'View Order Details';
      break;
    case 'design_submitted':
      subject = `Design Submitted for Order #${orderNumber}`;
      headline = 'Customer Submitted Design for Review';
      message = `${customerName || 'A customer'} has submitted their design for approval on order #${orderNumber}.`;
      actionLabel = 'Review Design';
      break;
    case 'artwork_approved':
      subject = `Artwork Approved for Order #${orderNumber}`;
      headline = 'Customer Approved Artwork!';
      message = `${customerName || 'The customer'} has approved the artwork for order #${orderNumber}. It's ready for production!`;
      actionLabel = 'Start Production';
      break;
    case 'issue_flagged':
      subject = `Issue Flagged on Order #${orderNumber}`;
      headline = 'Printing Issue Flagged';
      message = `An issue has been flagged on order #${orderNumber}. The customer has been notified to review and approve the changes.`;
      actionLabel = 'View Order';
      break;
    default:
      return false;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #1a1a1a; padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Sticky Banditos Admin</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px;">
        <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 20px;">${headline}</h2>
        <p style="margin: 0 0 24px; color: #666; font-size: 14px;">${message}</p>
        
        <div style="background-color: #f0f9ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #0369a1; font-weight: 600;">Order #${orderNumber}</p>
          ${customerName ? `<p style="margin: 8px 0 0; color: #666; font-size: 14px;">Customer: ${customerName}</p>` : ''}
          ${customerEmail ? `<p style="margin: 4px 0 0; color: #666; font-size: 14px;">Email: ${customerEmail}</p>` : ''}
        </div>

        ${artworkPreviewUrl ? `
        <div style="text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 12px; color: #333; font-weight: 600;">Submitted Artwork:</p>
          <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; background-color: #fafafa;">
            <img src="${artworkPreviewUrl}" alt="Submitted Design" style="max-width: 100%; max-height: 300px; border-radius: 4px;">
          </div>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 32px 0;">
          <a href="${orderUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            ${actionLabel}
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f5f5f5; padding: 16px; text-align: center;">
        <p style="margin: 0; color: #999; font-size: 12px;">
          This is an automated notification from Sticky Banditos
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const success = await sendEmail(ADMIN_EMAIL, subject, html);
  if (success) {
    console.log(`Admin notification (${type}) sent for order ${orderNumber}`);
  }
  return success;
}
