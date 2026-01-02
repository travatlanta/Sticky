/**
 * Shared HTML renderer for the Order Confirmation email.
 *
 * Intentionally "pure" (no DB/network access) so it can be used both:
 * - server-side when sending the email
 * - client-side for the admin "live preview"
 */

export interface ReceiptSettings {
  headerColor: string;
  logoUrl: string;
  companyName: string;
  supportEmail: string;
  companyAddress: string;
  companyPhone: string;
  footerMessage: string;
  thankYouMessage: string;
}

export interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

const DEFAULT_SETTINGS: ReceiptSettings = {
  headerColor: "#1a1a1a",
  logoUrl: "",
  companyName: "Sticky Banditos Printing Company",
  supportEmail: "mhobbs.stickybanditos@gmail.com",
  companyAddress: "2 North 35th Ave, Phoenix, AZ 85009",
  companyPhone: "602-554-5338",
  footerMessage: "Questions about your order? Contact us at",
  thankYouMessage: "Thank you for your order!",
};

function mergeReceiptSettings(
  settings: Partial<ReceiptSettings> | null | undefined
): ReceiptSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
  };
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function renderOrderConfirmationEmailHtml(opts: {
  siteUrl: string;
  orderNumber: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  totals: OrderTotals;
  receiptSettings?: Partial<ReceiptSettings> | null;
}): string {
  const settings = mergeReceiptSettings(opts.receiptSettings);

  const itemsHtml = opts.items
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
    .join("");

  const addressHtml = `
    ${opts.shippingAddress.name}<br>
    ${opts.shippingAddress.address1}<br>
    ${opts.shippingAddress.address2 ? `${opts.shippingAddress.address2}<br>` : ""}
    ${opts.shippingAddress.city}, ${opts.shippingAddress.state} ${opts.shippingAddress.zip}<br>
    ${opts.shippingAddress.country || "USA"}
  `;

  const safeSiteUrl = (opts.siteUrl || "").replace(/\/$/, "");
  const logoHtml = settings.logoUrl
    ? `<img src="${settings.logoUrl}" alt="${settings.companyName}" height="60" style="max-height: 60px; height: 60px; display: block; border: 0; outline: none; text-decoration: none;">`
    : `<img src="${safeSiteUrl}/logo.png" alt="${settings.companyName}" height="60" style="max-height: 60px; height: 60px; display: block; border: 0; outline: none; text-decoration: none;">`;

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <center style="width: 100%; background-color: #f5f5f5;">
    <!-- Preheader (hidden preview text) -->
    <div style="display: none; font-size: 1px; color: #f5f5f5; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
      Order Confirmation – ${opts.orderNumber} – ${settings.companyName}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f5f5"
      style="width: 100%; background-color: #f5f5f5; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
      <tr>
        <td align="center" style="padding: 24px 12px;">
          <!--[if (gte mso 9)|(IE)]>
          <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
          <![endif]-->

          <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"
            style="width: 600px; max-width: 600px; Margin: 0 auto; background-color: #ffffff; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
<!-- Header -->
          <tr>
            <td bgcolor="${settings.headerColor}" style="background-color: ${settings.headerColor}; padding: 24px; text-align: center;">
              ${logoHtml}
            </td>
          </tr>

          <!-- Order Confirmation Title -->
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: bold;">Order Confirmation</h1>
              <p style="margin: 8px 0 0 0; color: #666; font-size: 16px;">${settings.thankYouMessage}</p>
            </td>
          </tr>

          <!-- Order Number -->
          <tr>
            <td style="padding: 0 32px 24px 32px; text-align: center;">
              <div style="background-color: #f8f8f8; border-radius: 8px; padding: 16px; display: inline-block;">
                <span style="color: #666; font-size: 14px;">Order Number</span><br>
                <span style="color: #1a1a1a; font-size: 20px; font-weight: bold;">${opts.orderNumber}</span>
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
                  <td style="padding: 8px 0; text-align: right; font-family: Arial, sans-serif;">${formatCurrency(opts.totals.subtotal)}</td>
                </tr>
                ${
                  opts.totals.shipping > 0
                    ? `
                <tr>
                  <td style="padding: 8px 0; font-family: Arial, sans-serif; color: #666;">Expedited Shipping</td>
                  <td style="padding: 8px 0; text-align: right; font-family: Arial, sans-serif;">${formatCurrency(opts.totals.shipping)}</td>
                </tr>
                `
                    : ""
                }
                ${
                  opts.totals.tax > 0
                    ? `
                <tr>
                  <td style="padding: 8px 0; font-family: Arial, sans-serif; color: #666;">Tax</td>
                  <td style="padding: 8px 0; text-align: right; font-family: Arial, sans-serif;">${formatCurrency(opts.totals.tax)}</td>
                </tr>
                `
                    : ""
                }
                <tr>
                  <td style="padding: 16px 0 8px 0; font-family: Arial, sans-serif; font-weight: bold; font-size: 18px; border-top: 2px solid #333;">Grand Total</td>
                  <td style="padding: 16px 0 8px 0; text-align: right; font-family: Arial, sans-serif; font-weight: bold; font-size: 18px; border-top: 2px solid #333;">${formatCurrency(opts.totals.total)}</td>
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
                ${settings.footerMessage}<br>
                <a href="mailto:${settings.supportEmail}" style="color: #1a1a1a;">${settings.supportEmail}</a>
              </p>
              <p style="margin: 16px 0 0 0; color: #999; font-size: 12px; font-family: Arial, sans-serif;">
                ${settings.companyName}<br>
                ${settings.companyAddress}<br>
                <a href="tel:${settings.companyPhone.replace(/[^0-9]/g, "")}" style="color: #999;">${settings.companyPhone}</a>
              </p>
            </td>
          </tr>

          </table>

          <!--[if (gte mso 9)|(IE)]>
              </td>
            </tr>
          </table>
          <![endif]-->
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;

  return htmlBody;
}
