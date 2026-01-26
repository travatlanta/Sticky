# Sticky Banditos - Technical Backend Documentation

This document provides a complete technical breakdown of the Sticky Banditos e-commerce platform backend architecture, database schema, API structure, and integration patterns. Use this as a reference when migrating, extending, or debugging the system.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Routes Structure](#api-routes-structure)
5. [Authentication System](#authentication-system)
6. [Payment Processing](#payment-processing)
7. [Order Lifecycle](#order-lifecycle)
8. [Email System](#email-system)
9. [File Storage](#file-storage)
10. [Environment Variables](#environment-variables)
11. [Key Business Logic](#key-business-logic)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                    Next.js React Frontend                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS APP ROUTER                          │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Page Routes    │  │   API Routes    │  │  Server Actions │  │
│  │  /products/*    │  │   /api/*        │  │                 │  │
│  │  /checkout      │  │                 │  │                 │  │
│  │  /admin/*       │  │                 │  │                 │  │
│  └─────────────────┘  └────────┬────────┘  └─────────────────┘  │
└────────────────────────────────┼────────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│    PostgreSQL   │   │   Square API    │   │   Vercel Blob   │
│   (Neon DB)     │   │   (Payments)    │   │  (File Storage) │
└─────────────────┘   └─────────────────┘   └─────────────────┘
          │
          ▼
┌─────────────────┐
│   Resend API    │
│   (Emails)      │
└─────────────────┘
```

### Directory Structure

```
next-app/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (backend endpoints)
│   │   ├── admin/         # Admin-only endpoints
│   │   ├── auth/          # Authentication endpoints
│   │   ├── cart/          # Shopping cart operations
│   │   ├── checkout/      # Payment processing
│   │   ├── designs/       # Design management
│   │   ├── orders/        # Order management
│   │   ├── products/      # Product catalog
│   │   └── ...
│   ├── (pages)/           # Frontend pages
│   └── layout.tsx         # Root layout
├── lib/                   # Shared backend utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Database connection
│   ├── email.ts          # Email utilities
│   ├── email/            # Email templates & senders
│   └── square.ts         # Square payment helpers
├── shared/               # Shared types & schema
│   └── schema.ts         # Drizzle ORM schema (single source of truth)
└── components/           # React components
```

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework |
| **Language** | TypeScript | Type-safe JavaScript |
| **Database** | PostgreSQL (Neon) | Serverless PostgreSQL |
| **ORM** | Drizzle ORM | Type-safe database queries |
| **Authentication** | NextAuth.js | OAuth & credentials auth |
| **Payments** | Square | Credit card processing |
| **File Storage** | Vercel Blob | Image/file uploads |
| **Email** | Resend | Transactional emails |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **UI Components** | shadcn/ui | React component library |

---

## Database Schema

All database tables are defined in `next-app/shared/schema.ts` using Drizzle ORM.

### Core Entities

#### Users (`users`)
Stores customer and admin accounts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR (UUID) | Primary key, auto-generated |
| `email` | VARCHAR | Unique email address |
| `password_hash` | VARCHAR | Bcrypt hashed password (null for OAuth) |
| `first_name` | VARCHAR | User's first name |
| `last_name` | VARCHAR | User's last name |
| `phone` | VARCHAR | Phone number |
| `profile_image_url` | VARCHAR | Profile picture URL |
| `google_id` | VARCHAR | Google OAuth ID (unique) |
| `is_admin` | BOOLEAN | Admin flag (default: false) |
| `created_at` | TIMESTAMP | Account creation time |

#### Categories (`categories`)
Product category organization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `name` | VARCHAR(100) | Display name |
| `slug` | VARCHAR(100) | URL-friendly identifier (unique) |
| `description` | TEXT | Category description |
| `image_url` | VARCHAR | Category image |
| `display_order` | INTEGER | Sort order |
| `is_active` | BOOLEAN | Visibility flag |

#### Products (`products`)
Product catalog with pricing and printing specs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `category_id` | INTEGER | FK to categories |
| `name` | VARCHAR(200) | Product name |
| `slug` | VARCHAR(200) | URL slug (unique) |
| `description` | TEXT | Product description |
| `thumbnail_url` | VARCHAR | Main product image |
| `base_price` | DECIMAL(10,2) | Starting price |
| `min_quantity` | INTEGER | Minimum order quantity |
| `is_active` | BOOLEAN | Active/inactive |
| `is_featured` | BOOLEAN | Show on homepage |
| `print_width_inches` | DECIMAL(6,3) | Print width in inches |
| `print_height_inches` | DECIMAL(6,3) | Print height in inches |
| `print_dpi` | INTEGER | Print resolution (default: 300) |
| `bleed_size` | DECIMAL(4,3) | Bleed margin in inches |
| `safe_zone_size` | DECIMAL(4,3) | Safe zone margin |
| `supports_custom_shape` | BOOLEAN | Die-cut support |
| `shipping_type` | ENUM | 'free', 'flat', 'calculated' |
| `flat_shipping_price` | DECIMAL(10,2) | Flat rate if applicable |
| `is_deal_product` | BOOLEAN | Created from a deal |
| `deal_id` | INTEGER | Associated deal |
| `fixed_quantity` | INTEGER | Locked quantity for deals |
| `fixed_price` | DECIMAL(10,2) | Locked price for deals |

#### Product Options (`product_options`)
Customizable product attributes (size, material, coating, etc.).

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `product_id` | INTEGER | FK to products |
| `option_type` | ENUM | 'size', 'material', 'coating', 'shape', 'cut' |
| `name` | VARCHAR(100) | Display name |
| `value` | VARCHAR(100) | Option value |
| `price_modifier` | DECIMAL(10,2) | Price adjustment |
| `is_default` | BOOLEAN | Default selection |
| `display_order` | INTEGER | Sort order |

#### Pricing Tiers (`pricing_tiers`)
Volume-based quantity discounts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `product_id` | INTEGER | FK to products |
| `min_quantity` | INTEGER | Tier minimum |
| `max_quantity` | INTEGER | Tier maximum (null = unlimited) |
| `price_per_unit` | DECIMAL(10,4) | Unit price at this tier |

#### Designs (`designs`)
Customer artwork/designs created in the editor.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | VARCHAR | FK to users (null for anonymous) |
| `session_id` | VARCHAR | Anonymous session identifier |
| `product_id` | INTEGER | FK to products |
| `name` | VARCHAR(200) | Design name |
| `canvas_json` | JSONB | Fabric.js canvas state |
| `preview_url` | VARCHAR | PNG preview image |
| `custom_shape_url` | VARCHAR | Die-cut shape image |
| `contour_path` | TEXT | SVG path for die-cut |
| `high_res_export_url` | VARCHAR | Print-ready file |
| `status` | ENUM | 'draft', 'submitted', 'approved' |
| `selected_options` | JSONB | Selected product options |
| `bleed_color` | VARCHAR(20) | Bleed zone fill color |

#### Carts (`carts`) & Cart Items (`cart_items`)
Shopping cart for logged-in and anonymous users.

**Carts:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | VARCHAR | FK to users (null for anonymous) |
| `session_id` | VARCHAR | Anonymous session ID |
| `expires_at` | TIMESTAMP | Cart expiration |

**Cart Items:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `cart_id` | INTEGER | FK to carts |
| `product_id` | INTEGER | FK to products |
| `design_id` | INTEGER | FK to designs |
| `quantity` | INTEGER | Item quantity |
| `selected_options` | JSONB | Selected options |
| `unit_price` | DECIMAL(10,2) | Calculated unit price |
| `media_type` | VARCHAR(50) | Material type |
| `finish_type` | VARCHAR(50) | Coating type |

#### Orders (`orders`)
Completed and pending orders.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `order_number` | VARCHAR(20) | Human-readable order # (unique) |
| `user_id` | VARCHAR | FK to users |
| `customer_email` | VARCHAR(255) | Order email |
| `customer_name` | VARCHAR(255) | Customer name |
| `customer_phone` | VARCHAR(50) | Phone number |
| `status` | ENUM | Order status (see below) |
| `subtotal` | DECIMAL(10,2) | Items subtotal |
| `shipping_cost` | DECIMAL(10,2) | Shipping charge |
| `tax_amount` | DECIMAL(10,2) | Tax amount |
| `discount_amount` | DECIMAL(10,2) | Discount applied |
| `total_amount` | DECIMAL(10,2) | Final total |
| `shipping_address` | JSONB | Shipping address object |
| `billing_address` | JSONB | Billing address object |
| `stripe_payment_intent_id` | VARCHAR | Square payment ID |
| `tracking_number` | VARCHAR | Shipping tracking |
| `tracking_carrier` | VARCHAR | Carrier name |
| `notes` | TEXT | Order notes |
| `created_by_admin_id` | VARCHAR | Admin who created order |
| `payment_link_token` | VARCHAR(64) | Token for payment links |
| `artwork_status` | ENUM | Artwork approval status |
| `customer_artwork_url` | VARCHAR | Customer uploaded artwork |
| `admin_design_id` | INTEGER | Admin-created design |
| `artwork_notes` | TEXT | Artwork revision notes |
| `artwork_approved_at` | TIMESTAMP | When artwork was approved |

**Order Status Values:**
- `pending_payment` - Awaiting payment
- `pending` - Paid, awaiting processing
- `paid` - Payment confirmed
- `in_production` - Being printed
- `printed` - Printing complete
- `shipped` - In transit
- `delivered` - Received by customer
- `cancelled` - Order cancelled

**Artwork Status Values:**
- `awaiting_artwork` - No artwork yet
- `customer_designing` - Customer using editor
- `artwork_uploaded` - Customer uploaded file
- `admin_designing` - Admin creating design
- `pending_approval` - Awaiting customer approval
- `revision_requested` - Customer requested changes
- `approved` - Artwork approved for print

#### Order Items (`order_items`)
Individual products within an order.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `order_id` | INTEGER | FK to orders |
| `product_id` | INTEGER | FK to products |
| `design_id` | INTEGER | FK to designs |
| `quantity` | INTEGER | Item quantity |
| `unit_price` | DECIMAL(10,2) | Price per unit |
| `selected_options` | JSONB | Options snapshot |
| `print_file_url` | VARCHAR | Print-ready file |
| `media_type` | VARCHAR(50) | Material |
| `finish_type` | VARCHAR(50) | Coating |

#### Promotions (`promotions`)
Discount codes and promotions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `code` | VARCHAR(50) | Promo code (unique) |
| `discount_type` | ENUM | 'percentage' or 'fixed' |
| `discount_value` | DECIMAL(10,2) | Discount amount |
| `min_order_amount` | DECIMAL(10,2) | Minimum order |
| `max_uses` | INTEGER | Total usage limit |
| `uses_count` | INTEGER | Current usage |
| `uses_per_user` | INTEGER | Per-user limit |
| `is_active` | BOOLEAN | Active flag |
| `starts_at` | TIMESTAMP | Start date |
| `expires_at` | TIMESTAMP | Expiration date |

#### Deals (`deals`)
Hot deals displayed on homepage and deals page.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `title` | VARCHAR(200) | Deal title |
| `description` | TEXT | Deal description |
| `image_url` | VARCHAR | Deal image |
| `original_price` | DECIMAL(10,2) | Original price |
| `deal_price` | DECIMAL(10,2) | Sale price |
| `quantity` | INTEGER | Quantity included |
| `product_size` | VARCHAR(50) | Size description |
| `product_type` | VARCHAR(100) | Product type |
| `badge_text` | VARCHAR(50) | Badge label |
| `badge_color` | VARCHAR(50) | Badge color |
| `cta_text` | VARCHAR(50) | Button text |
| `source_product_id` | INTEGER | Template product |
| `deal_product_id` | INTEGER | Created deal product |
| `show_on_homepage` | BOOLEAN | Feature on home |
| `starts_at` | TIMESTAMP | Start date |
| `ends_at` | TIMESTAMP | End date |

#### Notifications (`notifications`)
User notifications for order updates, artwork status, etc.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `user_id` | VARCHAR | FK to users |
| `type` | ENUM | Notification type |
| `title` | VARCHAR(200) | Notification title |
| `message` | TEXT | Notification body |
| `order_id` | INTEGER | Related order |
| `link_url` | VARCHAR(500) | Click-through URL |
| `is_read` | BOOLEAN | Read status |

#### Messages (`messages`)
Live chat messages between customers and support.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `order_id` | INTEGER | Related order |
| `user_id` | VARCHAR | Sender user |
| `sender_type` | ENUM | 'user' or 'admin' |
| `content` | TEXT | Message text |
| `attachments` | JSONB | File attachments |
| `is_read` | BOOLEAN | Read status |
| `needs_human_support` | BOOLEAN | Escalation flag |

#### Site Settings (`site_settings`)
Key-value store for site configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `key` | VARCHAR(100) | Setting key (unique) |
| `value` | JSONB | Setting value |

---

## API Routes Structure

All API routes are in `next-app/app/api/`. Each route file exports HTTP method handlers.

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | List all active products |
| `/api/products/[slug]` | GET | Get product by slug |
| `/api/products/[slug]/templates` | GET | Get product templates |
| `/api/products/[slug]/calculate-price` | POST | Calculate dynamic price |
| `/api/categories` | GET | List categories |
| `/api/deals` | GET | List active deals |
| `/api/deals/homepage` | GET | Homepage featured deals |
| `/api/cart` | GET | Get current cart |
| `/api/cart/add` | POST | Add item to cart |
| `/api/cart/items/[id]` | PATCH/DELETE | Update/remove cart item |
| `/api/checkout/create-payment` | POST | Process checkout payment |
| `/api/orders` | GET | User's order history |
| `/api/orders/[id]` | GET | Get order details |
| `/api/orders/[id]/pay` | POST | Pay for existing order |
| `/api/orders/[id]/artwork` | GET | Get order artwork |
| `/api/orders/[id]/artwork/upload` | POST | Upload artwork |
| `/api/orders/[id]/artwork/approve` | POST | Approve artwork |
| `/api/orders/by-token/[token]` | GET | Get order by payment link token |
| `/api/designs` | GET/POST | List/create designs |
| `/api/designs/[id]` | GET/PATCH/DELETE | Design CRUD |
| `/api/messages` | GET/POST | Chat messages |
| `/api/notifications` | GET/PATCH | User notifications |
| `/api/settings/homepage` | GET | Homepage settings |
| `/api/settings/theme` | GET | Theme settings |

### Auth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | * | NextAuth.js handlers |
| `/api/auth/register` | POST | Create new account |
| `/api/auth/user` | GET | Get current user |
| `/api/account/orders` | GET | User's orders |
| `/api/account/change-password` | POST | Change password |

### Admin Endpoints (require `isAdmin: true`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/products` | GET/POST | Product management |
| `/api/admin/products/[id]` | GET/PATCH/DELETE | Single product CRUD |
| `/api/admin/products/[id]/options` | POST | Add product options |
| `/api/admin/products/[id]/pricing-tiers` | POST | Set pricing tiers |
| `/api/admin/products/[id]/templates` | POST | Add templates |
| `/api/admin/categories` | GET/POST | Category management |
| `/api/admin/categories/[id]` | PATCH/DELETE | Single category |
| `/api/admin/orders` | GET | All orders list |
| `/api/admin/orders/create` | POST | Create order for customer |
| `/api/admin/orders/[id]` | GET/PATCH | Order management |
| `/api/admin/orders/[id]/status` | PATCH | Update order status |
| `/api/admin/orders/[id]/artwork` | GET/POST | Manage order artwork |
| `/api/admin/orders/[id]/artwork/review` | POST | Review artwork |
| `/api/admin/orders/[id]/resend-receipt` | POST | Resend order email |
| `/api/admin/deals` | GET/POST | Deals management |
| `/api/admin/deals/[id]` | PATCH/DELETE | Single deal |
| `/api/admin/promotions` | GET/POST | Promo codes |
| `/api/admin/promotions/[id]` | PATCH/DELETE | Single promo |
| `/api/admin/users` | GET | User list |
| `/api/admin/admins` | GET | Admin list |
| `/api/admin/admins/invite` | POST | Invite admin |
| `/api/admin/admins/revoke` | POST | Revoke admin |
| `/api/admin/stats` | GET | Dashboard stats |
| `/api/admin/finances` | GET | Financial reports |
| `/api/admin/inbox` | GET | Support inbox |
| `/api/admin/messages` | GET/POST | Admin messages |
| `/api/admin/settings` | GET/PATCH | Site settings |
| `/api/admin/settings/homepage` | GET/PATCH | Homepage content |
| `/api/admin/settings/theme` | GET/PATCH | Theme settings |
| `/api/admin/settings/receipt` | GET/PATCH | Email receipt settings |

---

## Authentication System

### Overview
Authentication is handled by **NextAuth.js** with two providers:
1. **Credentials** - Email/password login
2. **Google OAuth** - Sign in with Google

### Configuration (`next-app/lib/auth.ts`)

```typescript
// Key configuration points:
- Credentials provider with bcrypt password verification
- Google OAuth (optional, requires GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET)
- JWT session strategy (not database sessions)
- Custom login page at /login
- Admin flag passed through JWT token
```

### Session Structure

```typescript
session.user = {
  id: string,        // Database user ID
  email: string,
  name: string,
  isAdmin: boolean   // Admin flag
}
```

### Protecting Routes

```typescript
// In API routes:
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // For admin routes:
  if (!(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // ... handler logic
}
```

---

## Payment Processing

### Square Integration

Payments are processed through **Square Payments API**.

#### Flow for Customer Checkout

1. Frontend loads Square Web Payments SDK
2. Customer enters card details in Square's secure iframe
3. Frontend calls `card.tokenize()` to get a `sourceId`
4. Frontend POSTs to `/api/checkout/create-payment` with:
   - `sourceId` - Square payment token
   - `shippingAddress` - Shipping details
   - `checkoutEmail` - Customer email
   - Cart items are read from session cart

5. Backend:
   - Validates cart and calculates totals
   - Calls Square Payments API with token
   - Creates order in database
   - Sends confirmation email
   - Clears cart
   - Returns order ID

#### Flow for Admin-Created Orders (Payment Links)

1. Admin creates order via `/api/admin/orders/create`
2. System generates `payment_link_token`
3. Customer receives link: `/orders/by-token/[token]`
4. Customer enters payment details
5. Payment processed via `/api/orders/by-token/[token]/pay`

#### Key Files

- `next-app/lib/square.ts` - Square client setup
- `next-app/app/api/checkout/create-payment/route.ts` - Main checkout
- `next-app/app/api/orders/[id]/pay/route.ts` - Pay existing order

#### Environment Variables

```
SQUARE_ACCESS_TOKEN=your_access_token
NEXT_PUBLIC_SQUARE_APPLICATION_ID=your_app_id
NEXT_PUBLIC_SQUARE_LOCATION_ID=your_location_id
```

---

## Order Lifecycle

### Customer-Created Orders

```
Cart → Checkout → Payment → Order Created (status: 'paid')
                                    ↓
                         Artwork Upload/Design
                                    ↓
                         In Production → Printed → Shipped → Delivered
```

### Admin-Created Orders

```
Admin Creates Order (status: 'pending_payment', artworkStatus: 'admin_designing')
         ↓
    Payment Link Sent to Customer
         ↓
    Customer Pays → (status: 'pending_payment' → 'paid')
         ↓
    Admin Uploads Artwork (artworkStatus: 'pending_approval')
         ↓
    Customer Approves → (artworkStatus: 'approved')
         ↓
    In Production → Printed → Shipped → Delivered
```

### Status Badge Logic

- **Customer orders**: Default "Ready" status unless admin requests revision
- **Admin orders**: Default "Pending" until customer approves artwork
- **All orders**: "Shipped" when tracking number is added (takes priority)

---

## Email System

### Provider: Resend

Emails are sent via the **Resend** API.

### Email Types

| Type | Trigger | Template |
|------|---------|----------|
| Order Confirmation | After payment | `sendOrderConfirmationEmail.ts` |
| Admin Notification | New order/payment | `sendNotificationEmails.ts` |
| Artwork Approval Request | Admin uploads artwork | `sendNotificationEmails.ts` |
| Shipping Notification | Tracking added | `sendNotificationEmails.ts` |

### Key Files

- `next-app/lib/email.ts` - Resend client setup
- `next-app/lib/email/sendOrderConfirmationEmail.ts` - Order receipts
- `next-app/lib/email/sendNotificationEmails.ts` - Admin/customer notifications
- `next-app/lib/email/template.ts` - HTML email templates

### Email Delivery Tracking

The `email_deliveries` table tracks email sending status:
- `pending` - Not yet sent
- `sent` - Successfully delivered
- `failed` - Send failed

Retry logic available via `/api/cron/retry-email-deliveries`.

### Environment Variables

```
RESEND_API_KEY=re_xxxxxxxx
ADMIN_EMAIL=admin@yourdomain.com
```

---

## File Storage

### Provider: Vercel Blob

All file uploads (artwork, product images, designs) are stored in **Vercel Blob**.

### Upload Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/upload/designs` | Design preview images |
| `/api/upload/artwork` | Customer artwork uploads |
| `/api/upload/products` | Product images |
| `/api/upload/templates` | Design templates |
| `/api/admin/upload/product-image` | Admin product uploads |
| `/api/admin/upload/deal-image` | Deal images |

### Usage Pattern

```typescript
import { put } from '@vercel/blob';

const blob = await put(filename, file, {
  access: 'public',
});

// blob.url contains the public URL
```

### Environment Variables

```
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxxxx
```

---

## Environment Variables

### Required

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com

# Square Payments
SQUARE_ACCESS_TOKEN=your-square-access-token
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sandbox-sq0xxx
NEXT_PUBLIC_SQUARE_LOCATION_ID=LXXXXXX

# File Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx

# Email
RESEND_API_KEY=re_xxxxxxxx
ADMIN_EMAIL=admin@yourdomain.com
```

### Optional

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI (for AI features)
OPENAI_API_KEY=sk-xxxxxxxx
```

---

## Key Business Logic

### Pricing Calculation

Price is calculated based on:
1. **Base price** from product
2. **Quantity tier** - volume discounts
3. **Option modifiers** - material, coating, size adjustments
4. **Promotions** - discount codes

```typescript
// Simplified pricing logic:
let unitPrice = getUnitPriceForQuantity(product, quantity);
unitPrice += sumOptionModifiers(selectedOptions);
let total = unitPrice * quantity;
total -= applyPromotion(promoCode, total);
total += shippingCost + tax;
```

### Cart Session Management

- Logged-in users: Cart linked to `user_id`
- Anonymous users: Cart linked to `session_id` cookie
- Carts merge on login

### Design Editor

- Built with **Fabric.js** v5
- Canvas state saved as JSON in `designs.canvas_json`
- Preview image generated and saved to Vercel Blob
- Die-cut products use contour path for cutting outline

### Admin Order Creation

Admins can create orders for customers:
1. Select products and quantities
2. Enter customer details
3. System generates payment link
4. Customer receives email with link
5. Customer completes payment online

---

## Database Migrations

### Development

```bash
cd next-app
npm run db:push  # Push schema changes to database
```

### Production Notes

- Schema changes via `db:push` apply immediately
- For complex migrations, use Drizzle Kit migrations
- Always backup before schema changes

---

## Common Patterns

### Raw SQL Fallback

For production resilience when schema might be out of sync:

```typescript
import { sql } from 'drizzle-orm';

// Try with new column, fallback without
let result;
try {
  result = await db.execute(sql`
    INSERT INTO orders (col1, col2, new_column)
    VALUES (${val1}, ${val2}, ${val3})
    RETURNING id
  `);
} catch (error) {
  // Fallback without new column
  result = await db.execute(sql`
    INSERT INTO orders (col1, col2)
    VALUES (${val1}, ${val2})
    RETURNING id
  `);
}
```

### API Response Format

```typescript
// Success
return NextResponse.json({ data: result }, { status: 200 });

// Error
return NextResponse.json({ error: 'Message' }, { status: 400 });

// With no-cache headers
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache'
  }
});
```

---

## Troubleshooting

### Common Issues

1. **Payment succeeds but order fails**: Check schema sync, use raw SQL fallback
2. **Emails not sending**: Verify RESEND_API_KEY, check email_deliveries table
3. **Images not uploading**: Check BLOB_READ_WRITE_TOKEN
4. **Auth issues**: Verify NEXTAUTH_SECRET matches across environments

### Debug Logging

Most API routes include console logs with `[Route Name]` prefixes for tracing:

```typescript
console.log('[Checkout] Payment processing started');
console.log('[Pay API] Order status:', status);
```

---

## Migration Checklist

When migrating to a new system:

1. **Database**: Export PostgreSQL schema and data
2. **Environment Variables**: Copy all env vars to new platform
3. **File Storage**: Migrate Vercel Blob files or update URLs
4. **Square**: Update webhook URLs if using webhooks
5. **Email**: Update sender domain verification in Resend
6. **Auth**: Update NEXTAUTH_URL and OAuth callback URLs
7. **DNS**: Update domain records

---

*Last updated: January 2026*
