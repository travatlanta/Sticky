# stickybanditos.com — Technical Portfolio Breakdown

**Live Domain:** [stickybanditos.com](https://stickybanditos.com)  
**Project Type:** Custom E-Commerce Platform — Custom Stickers & Labels  
**Role:** Full-Stack Developer (Design to Deployment)  
**Deployed:** Vercel  
**Last Updated:** March 2026

---

## Project Summary

Sticky Banditos is a fully custom-built e-commerce platform for ordering custom stickers and labels. It includes a storefront, a browser-based design editor, a complete checkout and order management system, a real-time support chat, and a full admin dashboard — all built from scratch without Shopify or any third-party commerce platform.

---

## Domain & Hosting

| Detail | Value |
|--------|-------|
| **Primary Domain** | `stickybanditos.com` |
| **www Redirect** | `www.stickybanditos.com` → `stickybanditos.com` (301 permanent) |
| **Hosting Provider** | Vercel (Serverless) |
| **Deployment Method** | Git-based auto-deploy from `next-app/` directory |
| **CDN** | Vercel Edge Network (global) |
| **Image Host** | Vercel Blob (`*.public.blob.vercel-storage.com`) |
| **SEO** | XML sitemap via Next.js `sitemap.ts`, robots.txt, Google Analytics `G-EXT24JDCC7` |

---

## Core Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 14.x | Full-stack React framework (App Router) |
| **Language** | TypeScript | — | Type-safe JavaScript throughout |
| **Runtime** | Node.js / Vercel Serverless | — | API route execution |
| **Database** | PostgreSQL (Neon Serverless) | — | Primary data store |
| **ORM** | Drizzle ORM | 0.29.x | Type-safe SQL queries and schema |
| **Authentication** | NextAuth.js | 4.x | Sessions, OAuth, credentials |
| **Payments** | Square Payments API | 42.x | Credit card processing |
| **File Storage** | Vercel Blob | 0.22.x | Artwork, images, design exports |
| **Email** | Resend | 4.x | Transactional emails |
| **Design Canvas** | Fabric.js | 5.x | Browser-based vector/raster editor |
| **AI** | OpenAI API | 4.x | AI-assisted design/support features |
| **State Management** | TanStack React Query | 5.x | Server state, caching, data fetching |
| **UI Components** | shadcn/ui + Radix UI | — | Accessible, composable component library |
| **Styling** | Tailwind CSS | — | Utility-first CSS, mobile-first design |
| **Charts** | Recharts | 2.x | Admin analytics and financial charts |
| **Form Handling** | React Hook Form + Zod | — | Validated forms with schema-driven rules |
| **PDF Export** | jsPDF / PDFKit | — | Print-ready file generation |
| **Analytics** | Google Analytics | G-EXT24JDCC7 | Traffic and conversion tracking |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (Client)                       │
│             Next.js React Frontend (App Router)           │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  NEXT.JS APP ROUTER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Page Routes  │  │ API Routes   │  │ Server Actions │  │
│  │ /products/*  │  │ /api/*       │  │                │  │
│  │ /checkout    │  │              │  │                │  │
│  │ /admin/*     │  │              │  │                │  │
│  └──────────────┘  └──────┬───────┘  └────────────────┘  │
└─────────────────────────  │  ────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬──────────────────┐
         ▼               ▼               ▼                  ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │  Square API  │ │ Vercel Blob  │ │  Resend API  │
│  (Neon DB)   │ │  (Payments)  │ │  (Files)     │ │  (Email)     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Key Design Principle
All backend logic runs as **Next.js serverless API routes** under `next-app/app/api/`. There is no separate backend server in production — Vercel handles all function execution.

---

## Project Directory Structure

```
next-app/
├── app/
│   ├── api/                  # All backend API endpoints
│   │   ├── admin/            # Admin-only endpoints
│   │   ├── auth/             # Auth registration and user info
│   │   ├── cart/             # Cart operations
│   │   ├── checkout/         # Payment processing
│   │   ├── deals/            # Hot deals
│   │   ├── designs/          # Design CRUD
│   │   ├── messages/         # Live chat
│   │   ├── notifications/    # User notifications
│   │   ├── orders/           # Order management
│   │   ├── products/         # Product catalog
│   │   ├── settings/         # Site config
│   │   └── cron/             # Scheduled tasks
│   ├── admin/                # Admin dashboard pages
│   ├── cart/                 # Shopping cart page
│   ├── checkout/             # Checkout flow
│   ├── editor/               # Fabric.js design editor
│   ├── orders/               # Order tracking pages
│   ├── products/             # Product pages
│   └── account/              # User account/profile
├── components/               # Shared React components
│   ├── ui/                   # shadcn/ui base components
│   └── admin/                # Admin-specific components
├── lib/                      # Backend utilities
│   ├── auth.ts               # NextAuth configuration
│   ├── db.ts                 # Drizzle ORM database client
│   ├── square.ts             # Square payment helpers
│   ├── email.ts              # Resend email client
│   └── email/                # Email templates
└── shared/
    └── schema.ts             # Drizzle ORM schema (single source of truth)
```

---

## Authentication System

**Provider:** NextAuth.js with two authentication methods:

| Method | Details |
|--------|---------|
| **Email/Password** | Bcrypt-hashed passwords, credentials provider |
| **Google OAuth** | Sign in with Google (optional, env-configured) |

- Session strategy: **JWT** (stateless, no DB session lookups)
- Admin access: `isAdmin` boolean flag on user record, propagated through JWT
- Protected routes check `session.user.isAdmin` server-side
- Unauthorized → 401, Forbidden (non-admin) → 403

### Session Shape
```typescript
session.user = {
  id: string,        // UUID from database
  email: string,
  name: string,
  isAdmin: boolean
}
```

---

## Database Schema

**Database:** PostgreSQL via Neon (serverless, connection pooling)  
**ORM:** Drizzle ORM — schema defined in `next-app/shared/schema.ts`  
**Migrations:** Drizzle Kit (`npm run db:push`)

### Tables

| Table | Purpose |
|-------|---------|
| `users` | Customer and admin accounts |
| `sessions` | Auth session storage |
| `categories` | Product category organization |
| `products` | Product catalog with print specs |
| `product_options` | Customizable attributes (size, material, coating, shape, cut) |
| `pricing_tiers` | Volume-based quantity discounts |
| `designs` | Customer artwork saved from editor |
| `carts` | Active shopping carts (user or anonymous) |
| `cart_items` | Line items in a cart |
| `orders` | Completed and pending orders |
| `order_items` | Products within an order |
| `promotions` | Discount codes |
| `deals` | Hot deals for homepage/deals page |
| `notifications` | Per-user notification feed |
| `messages` | Live support chat messages |
| `site_settings` | Key-value CMS settings |
| `email_deliveries` | Email delivery tracking and retry log |

### Core Enums

```
order_status:   pending_payment | pending | paid | in_production |
                printed | ready_for_pickup | shipped | delivered | cancelled

artwork_status: awaiting_artwork | customer_designing | artwork_uploaded |
                admin_designing | pending_approval | revision_requested | approved

option_type:    size | material | coating | shape | cut

discount_type:  percentage | fixed

shipping_type:  free | flat | calculated
```

---

## Payment Processing

**Provider:** Square Payments API

### Checkout Flow (Customer)
1. Frontend loads Square Web Payments SDK
2. Customer enters card in Square's secure hosted iframe
3. `card.tokenize()` returns a one-time `sourceId`
4. POST to `/api/checkout/create-payment` with token + cart + shipping
5. Backend validates cart → calls Square Payments API → creates order record → sends confirmation email → clears cart

### Payment Link Flow (Admin-Created Orders)
1. Admin creates order → system generates `payment_link_token`
2. Customer receives unique link: `/orders/by-token/[token]`
3. Customer enters payment details → processed via `/api/orders/by-token/[token]/pay`

---

## Pricing Engine

Dynamic pricing calculated server-side:

```
Unit Price = Tier Price (based on quantity) + Option Modifiers (material/coating)
Order Total = (Unit Price × Quantity) − Promo Discount + Shipping + Tax
```

- **Pricing tiers:** min/max quantity brackets with per-unit prices
- **Option modifiers:** price adjustments per selected material, coating, etc.
- **Promotions:** percentage or fixed-amount discount codes with usage limits
- **Shipping:** per-product setting — `free`, `flat` rate, or `calculated`

---

## Design Editor

**Engine:** Fabric.js v5 (canvas-based)  
**Route:** `/editor/[productSlug]`

### Features
- **Text** — custom fonts, colors, sizing, styling
- **Graphics** — basic shapes (square, circle, triangle, star, heart) + clipart (arrows, badges, lightning, checkmarks)
- **Image Upload** — customer uploads placed directly on canvas
- **Freehand Drawing** — brush tool with color and size controls
- **Effects** — drop shadow (blur/offset/color), glow (intensity/color), outline (width/color)
- **Bleed Zone** — adjustable bleed size (0.125"–0.5") with custom color
- **Die-Cut Support** — checkerboard transparency background for products with `supportsCustomShape = true`
- **Contour Tracing** — auto-generates SVG cutting path from design outline
- **Export** — high-resolution PNG for print, preview PNG for order display
- Canvas state persisted as JSONB (`designs.canvas_json`) to database
- Preview images and high-res exports uploaded to Vercel Blob

---

## Order Lifecycle

### Customer-Created
```
Cart → Checkout → Payment → Order (paid)
    → Artwork Upload or Editor
    → In Production → Printed → Shipped → Delivered
```

### Admin-Created
```
Admin Creates Order → Payment Link → Customer Pays
    → Admin Uploads Artwork → Customer Approves
    → In Production → Printed → Shipped → Delivered
```

### Status Badge Logic
- **Customer orders:** Show "Ready" by default; "Pending" only if admin requests revision
- **Admin orders:** Show "Pending" until customer approves artwork
- **All orders:** "Shipped" when tracking number is set (overrides other statuses)

---

## Email System

**Provider:** Resend API

| Email Type | Trigger |
|-----------|---------|
| Order Confirmation | After successful payment |
| Admin Notification | New order / payment received |
| Artwork Approval Request | Admin uploads artwork for customer review |
| Shipping Notification | Tracking number added to order |

- All emails use custom HTML templates (`lib/email/template.ts`)
- Delivery status tracked in `email_deliveries` table (`pending` / `sent` / `failed`)
- Failed emails retried via scheduled cron: `/api/cron/retry-email-deliveries` (runs daily at 9AM UTC)

---

## File Storage

**Provider:** Vercel Blob  
**Access:** All files publicly accessible via CDN URL

| Upload Endpoint | Purpose |
|----------------|---------|
| `/api/upload/designs` | Design preview images |
| `/api/upload/artwork` | Customer artwork uploads |
| `/api/upload/products` | Product images |
| `/api/blob-upload` | General blob uploads |
| `/api/admin/upload/product-image` | Admin product images |
| `/api/admin/upload/deal-image` | Deal images |

---

## Admin Dashboard

Full administration panel at `/admin/` — restricted to users with `isAdmin: true`.

### Sections

| Section | Capabilities |
|---------|-------------|
| **Products** | Create, edit, delete products; manage options, pricing tiers, templates |
| **Categories** | Create and organize product categories |
| **Orders** | View all orders, update status, add tracking, manage artwork, resend receipts |
| **Deals** | Create hot deals linked to products for homepage and deals page |
| **Promotions** | Create/manage discount codes with percentage or fixed discounts, usage limits |
| **Users** | View all customers; manage admin roles (invite/revoke) |
| **Support Inbox** | Live chat interface — respond to customer messages per order |
| **Analytics** | Dashboard stats, financial reports with Recharts visualizations |
| **Site Settings** | CMS-style editing for homepage sections (Hero, Features, Products, CTA) |
| **Theme** | Customize site colors and branding via stored settings |
| **Receipt Settings** | Configure email receipt content and footer |

---

## API Route Summary

### Public Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | List active products |
| `/api/products/[slug]` | GET | Single product by slug |
| `/api/products/[slug]/calculate-price` | POST | Dynamic pricing calculation |
| `/api/categories` | GET | List categories |
| `/api/deals` | GET | Active deals |
| `/api/deals/homepage` | GET | Homepage featured deals |
| `/api/cart` | GET | Get current cart |
| `/api/cart/add` | POST | Add item to cart |
| `/api/cart/items/[id]` | PATCH/DELETE | Update or remove cart item |
| `/api/checkout/create-payment` | POST | Process checkout |
| `/api/orders` | GET | User's order history |
| `/api/orders/[id]` | GET | Order details |
| `/api/orders/[id]/artwork/upload` | POST | Upload order artwork |
| `/api/orders/[id]/artwork/approve` | POST | Approve artwork |
| `/api/orders/by-token/[token]` | GET | Order via payment link token |
| `/api/designs` | GET/POST | User designs |
| `/api/messages` | GET/POST | Support chat messages |
| `/api/notifications` | GET/PATCH | User notifications |
| `/api/settings/homepage` | GET | Homepage content config |
| `/api/settings/theme` | GET | Theme config |

### Auth Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | * | NextAuth.js handlers |
| `/api/auth/register` | POST | Register new account |
| `/api/auth/user` | GET | Current session user |
| `/api/account/orders` | GET | Account order history |
| `/api/account/change-password` | POST | Change password |

### Admin Routes (require `isAdmin: true`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/products` | GET/POST | Product management |
| `/api/admin/products/[id]` | GET/PATCH/DELETE | Single product CRUD |
| `/api/admin/categories` | GET/POST | Category management |
| `/api/admin/orders` | GET | All orders |
| `/api/admin/orders/create` | POST | Create order for customer |
| `/api/admin/orders/[id]/status` | PATCH | Update order status |
| `/api/admin/orders/[id]/artwork/review` | POST | Review/approve artwork |
| `/api/admin/orders/[id]/resend-receipt` | POST | Resend confirmation email |
| `/api/admin/deals` | GET/POST | Deals management |
| `/api/admin/promotions` | GET/POST | Promo codes |
| `/api/admin/users` | GET | User list |
| `/api/admin/admins/invite` | POST | Grant admin role |
| `/api/admin/admins/revoke` | POST | Revoke admin role |
| `/api/admin/stats` | GET | Dashboard statistics |
| `/api/admin/finances` | GET | Financial reports |
| `/api/admin/inbox` | GET | Support inbox |
| `/api/admin/settings/homepage` | GET/PATCH | Homepage CMS |
| `/api/admin/settings/theme` | GET/PATCH | Theme settings |
| `/api/admin/settings/receipt` | GET/PATCH | Email receipt settings |
| `/api/cron/retry-email-deliveries` | GET | Retry failed emails (cron, daily 9AM UTC) |

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Authentication
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://stickybanditos.com

# Google OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Square Payments
SQUARE_ACCESS_TOKEN=...
NEXT_PUBLIC_SQUARE_APPLICATION_ID=...
NEXT_PUBLIC_SQUARE_LOCATION_ID=...

# File Storage
BLOB_READ_WRITE_TOKEN=...

# Email
RESEND_API_KEY=...
ADMIN_EMAIL=...

# AI (optional)
OPENAI_API_KEY=...
```

---

## Notable Implementation Details

- **Mobile-First Design:** ~90% of users are on mobile; all UI built with mobile-first Tailwind breakpoints. The design editor uses a floating toolbar that never obscures the canvas preview.
- **Anonymous Cart Support:** Carts work without login, linked to a session cookie. On login, anonymous cart merges with user cart.
- **Global Product Options:** When any product is created via admin, Material (Vinyl/Foil/Holographic) and Spot Gloss (None/Varnish/Emboss) options are automatically attached.
- **Die-Cut Products:** Products with `supportsCustomShape = true` render a checkerboard transparency grid in the editor and generate an SVG contour path for the cutting machine.
- **Cron Job:** Daily email retry job runs at `0 9 * * *` via Vercel cron, configured in `vercel.json`.
- **50MB Server Actions:** Configured in `next.config.js` to support large design file uploads.
- **Raw SQL Fallback Pattern:** Critical database writes use try/catch with raw SQL fallbacks to ensure production resilience during schema transitions.
- **Homepage CMS:** All homepage sections (Hero, Features, Custom Stickers, Labels, Popular Products, CTA) are editable by admins and stored as JSONB in the `site_settings` table, with hardcoded defaults as fallback.

---

## Build & Development

```bash
# Development
cd next-app
npm run dev           # Start Next.js dev server

# Database
npm run db:push       # Push schema changes (Drizzle)
npm run db:studio     # Open Drizzle database UI

# Production
# Vercel auto-deploys on push to main branch from next-app/ root
```

---

*Document generated for portfolio use — stickybanditos.com*
