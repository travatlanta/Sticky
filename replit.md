# Sticky Banditos Printing Company

## Overview
Sticky Banditos is an e-commerce platform specializing in custom stickers and labels. It features a customer-facing storefront with product browsing, an integrated design editor, shopping cart functionality, and an admin panel for product, order, promotion, and site customization management. The business is focused on sticker products only (not business cards or flyers).

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Next.js Only)
- **Framework**: Next.js 14 with React 18 and TypeScript
- **Location**: `next-app/` directory
- **Routing**: Next.js App Router
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS with custom theme, shadcn/ui components
- **Design Editor**: Full-featured Fabric.js canvas editor with shapes, text, effects, and drawing tools
- **Key Features**: Product catalog, dynamic pricing, design editor, shopping cart, order management, admin dashboard.

### Backend (Next.js API Routes)
- **Runtime**: Next.js serverless functions on Vercel
- **Language**: TypeScript
- **API Design**: RESTful JSON APIs via `next-app/app/api/` routes
- **Authentication**: NextAuth.js with Replit OIDC integration
- **File Storage**: Vercel Blob for artwork uploads

### Legacy Express Server
- **Location**: `server/` directory
- **Purpose**: API-only server for development/seeding
- **Note**: Not used in production - Vercel deploys Next.js app directly

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM (Neon serverless)
- **Schema**: `next-app/shared/schema.ts`
- **Key Entities**: Users, Categories, Products, Pricing tiers, Designs, Carts, Orders, Promotions, Site settings.

### Authentication
- Replit OIDC for user login (via NextAuth.js)
- Admin role management via database

### Build System
- **Development**: `cd next-app && npm run dev` (Next.js dev server)
- **Production**: Vercel auto-deploys from `next-app/`
- **Database**: Drizzle ORM with `npm run db:push`

### UI/UX Decisions
- Mobile-first design throughout
- Upload+preview workflow for design, similar to StickerApp.com
- 90% of users access via mobile, so controls don't cover preview area

### Feature Specifications
- **Full Design Editor**: Fabric.js v5 canvas editor with:
  - **Text**: Add and customize text with fonts, colors, and styling
  - **Graphics**: Shapes (square, circle, triangle, star, heart) and clipart (arrows, checkmarks, badges, lightning)
  - **Uploads**: Upload images directly to canvas
  - **Drawing**: Freehand brush tool with color and size controls
  - **Effects**: Drop shadow (blur, offset, color), glow effect (intensity, color), outline (width, color)
  - **Adjustments**: Adjustable bleed zone size (0.125" to 0.5"), bleed color customization
  - **Die-Cut Support**: Checkerboard pattern background for transparent products (supportsCustomShape=true)
  - **Tab Styling**: Larger icons (w-5 h-5) with shadow effects on active tabs
  - Mobile-first design with floating toolbar. Stores designs in Vercel Blob.
- **Live Chat Support**: Real-time chat widget with polling, message history, and admin interface for support.
- **Order Tracking**: Detailed order views with timeline, shipping, items, and print-ready downloads.
- **Hot Deals**: Dynamic display of promotional products on homepage and a dedicated deals page.
- **Admin Dashboard**: Product, order, user, and promotion management.
- **Site Customization**: Full homepage content editing via admin panel with tabbed interface for Hero, Features, Custom Stickers, Stickers That Stick, Labels, Popular Products, and CTA sections. Settings stored in database with defaults fallback.
- **Analytics Dashboard**: Google Analytics integration info page showing tracking ID (G-EXT24JDCC7) and setup status. May take 24-48 hours for data to appear.
- **Enhanced Order Management**: Comprehensive order details including customer info, shipping address, detailed items with selected options, design files, financial summary, tracking, and notes.
- **Order Status Badge Logic**: 
  - **Customer-Created Orders**: Default "Ready" (print ready), only show "Pending" if admin requests revision
  - **Admin-Created Orders**: Default "Pending" until customer approves artwork, then "Ready"
  - **All Orders**: Show "Shipped" when tracking number is added (takes priority over other statuses)
  - Uses `createdByAdminId` to differentiate order source, `artworkStatus` for approval state, `trackingNumber` for shipping
- **Global Product Requirements**: All products automatically get:
  - **Material Options**: Vinyl, Foil, Holographic
  - **Spot Gloss Options**: None, Varnish, Emboss
  - **Artwork**: Required before checkout (upload or design)
  - These are added automatically when creating new products via admin panel.
  - For existing products without options, use POST `/api/admin/seed-options` to backfill.

## External Dependencies

### Third-Party Services
- **Stripe**: Payment processing (pending configuration).
- **Vercel Blob**: File storage for uploaded artwork.

### Database
- **PostgreSQL**: Primary database.
- **Neon Serverless**: PostgreSQL driver for serverless environments.

### Key Libraries
- **Vercel Blob**: Cloud file storage for artwork.
- **Drizzle ORM**: Type-safe database queries.
- **NextAuth.js**: Authentication framework.
- **Zod**: Runtime schema validation.