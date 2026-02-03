export const emailTypes = [
  'order_confirmation',
  'artwork_approval',
  'ready_for_pickup',
  'order_shipped',
  'order_issue_flagged',
  'artwork_approved_by_admin',
  'admin_new_order',
  'admin_design_submitted',
  'admin_artwork_approved',
  'admin_issue_flagged',
  'admin_order_paid',
] as const;

export type EmailType = typeof emailTypes[number];

export interface EmailTemplate {
  subject: string;
  headline: string;
  subheadline?: string;
  greeting?: string;
  bodyMessage: string;
  ctaButtonText: string;
  ctaButtonColor: 'orange' | 'green' | 'blue' | 'purple' | 'red';
  footerMessage?: string;
  thankYouMessage?: string;
  logoUrl?: string;
  enabled?: boolean;
}

export type EmailTemplates = Partial<Record<EmailType, EmailTemplate>>;

export const defaultTemplates: Record<EmailType, EmailTemplate> = {
  order_confirmation: {
    subject: 'Order Confirmation - {orderNumber} | Sticky Banditos',
    headline: 'Order Confirmation',
    subheadline: 'Your order has been received',
    greeting: 'Hi {customerName},',
    bodyMessage: 'Thank you for your order! We\'ve received your order and will begin processing it shortly.',
    ctaButtonText: 'View Order Details',
    ctaButtonColor: 'orange',
    footerMessage: 'Questions about your order? Contact us at',
    thankYouMessage: 'Thank you for your order!',
    enabled: true,
  },
  artwork_approval: {
    subject: 'Action Required: Approve Your Design - Order {orderNumber} | Sticky Banditos',
    headline: 'Your Design is Ready for Review',
    subheadline: 'One quick approval and we start printing!',
    greeting: 'Hi {customerName},',
    bodyMessage: 'Your custom design has been prepared and is ready for your approval. Take a look and let us know if it\'s good to print!',
    ctaButtonText: 'Review & Approve Design',
    ctaButtonColor: 'green',
    footerMessage: 'If you have any questions about your design, feel free to reply through your account messages.',
    enabled: true,
  },
  ready_for_pickup: {
    subject: 'Order {orderNumber} - Ready for Pickup! | Sticky Banditos',
    headline: 'Your Order is Ready for Pickup!',
    subheadline: 'Come pick up your order',
    greeting: 'Hi {customerName},',
    bodyMessage: 'Great news! Your order is ready and waiting for you.',
    ctaButtonText: 'View Order Details',
    ctaButtonColor: 'orange',
    footerMessage: 'Please bring a valid ID when picking up your order.',
    enabled: true,
  },
  order_shipped: {
    subject: 'Your Order {orderNumber} Has Shipped! | Sticky Banditos',
    headline: 'Your Order is On Its Way!',
    subheadline: 'Track your shipment',
    greeting: 'Hi {customerName},',
    bodyMessage: 'Great news! Your stickers have shipped and are on their way to you.',
    ctaButtonText: 'Track Your Order',
    ctaButtonColor: 'green',
    footerMessage: 'You can track your package using the tracking information in your order details.',
    enabled: true,
  },
  order_issue_flagged: {
    subject: 'Action Needed: Issue with Order {orderNumber} | Sticky Banditos',
    headline: 'We Need Your Attention',
    subheadline: 'Please review the update to your order',
    greeting: 'Hi {customerName},',
    bodyMessage: 'We found an issue with your artwork that needs your attention. We\'ve made some adjustments and need your approval before we can proceed with printing.',
    ctaButtonText: 'Review Changes',
    ctaButtonColor: 'orange',
    footerMessage: 'If you have any questions, please don\'t hesitate to reach out to us.',
    enabled: true,
  },
  artwork_approved_by_admin: {
    subject: 'Great News! Your Artwork is Approved - Order {orderNumber} | Sticky Banditos',
    headline: 'Your Artwork Has Been Approved!',
    subheadline: 'Production is starting soon',
    greeting: 'Hi {customerName},',
    bodyMessage: 'Excellent news! Your artwork has been reviewed and approved. We\'re now moving forward with production of your custom stickers.',
    ctaButtonText: 'View Order Details',
    ctaButtonColor: 'green',
    footerMessage: 'We\'ll notify you again once your order ships.',
    enabled: true,
  },
  admin_new_order: {
    subject: 'New Order {orderNumber} Received',
    headline: 'New Order Received!',
    bodyMessage: 'A new order has been placed by {customerName}.',
    ctaButtonText: 'View Order Details',
    ctaButtonColor: 'green',
    enabled: true,
  },
  admin_design_submitted: {
    subject: 'Design Submitted - Order {orderNumber}',
    headline: 'Design Submitted for Review',
    bodyMessage: '{customerName} has submitted their design for approval on order {orderNumber}.',
    ctaButtonText: 'Review Design',
    ctaButtonColor: 'purple',
    enabled: true,
  },
  admin_artwork_approved: {
    subject: 'Artwork Approved - Order {orderNumber}',
    headline: 'Customer Approved Artwork!',
    bodyMessage: '{customerName} has approved the artwork for order {orderNumber}. It\'s ready for production!',
    ctaButtonText: 'Start Production',
    ctaButtonColor: 'green',
    enabled: true,
  },
  admin_issue_flagged: {
    subject: 'Issue Flagged - Order {orderNumber}',
    headline: 'Printing Issue Flagged',
    bodyMessage: 'An issue has been flagged on order {orderNumber}. The customer has been notified to review and approve the changes.',
    ctaButtonText: 'View Order',
    ctaButtonColor: 'orange',
    enabled: true,
  },
  admin_order_paid: {
    subject: 'Payment Received - Order {orderNumber}',
    headline: 'Payment Received!',
    bodyMessage: '{customerName} has successfully paid for order {orderNumber}. The order is now ready for production!',
    ctaButtonText: 'View Order',
    ctaButtonColor: 'green',
    enabled: true,
  },
};

export const emailTypeLabels: Record<EmailType, string> = {
  order_confirmation: 'Order Confirmation',
  artwork_approval: 'Artwork Approval Request',
  ready_for_pickup: 'Ready for Pickup',
  order_shipped: 'Order Shipped',
  order_issue_flagged: 'Order Issue Flagged',
  artwork_approved_by_admin: 'Artwork Approved by Admin',
  admin_new_order: 'Admin: New Order',
  admin_design_submitted: 'Admin: Design Submitted',
  admin_artwork_approved: 'Admin: Artwork Approved',
  admin_issue_flagged: 'Admin: Issue Flagged',
  admin_order_paid: 'Admin: Order Paid',
};
