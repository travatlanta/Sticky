# Sticky Banditos Printing Company

## Overview
Sticky Banditos is an e-commerce platform for custom print products like stickers, business cards, and flyers. It features a customer-facing storefront with product browsing, an integrated design editor, shopping cart functionality, and an admin panel for product, order, and promotion management. The project aims to provide a comprehensive solution for custom printing needs.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS with custom theme, shadcn/ui components
- **Design Editor**: Fabric.js for custom product design (Note: A simplified Upload+Preview editor has been implemented in the `next-app` codebase, removing Fabric.js for a mobile-first, upload-focused workflow.)
- **Key Features**: Product catalog, dynamic pricing, design editor, shopping cart, order management, admin dashboard.

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Design**: RESTful JSON APIs
- **Authentication**: Custom Passport.js (email/password, Google OAuth), session-based with PostgreSQL storage.
- **Modularity**: Structured with `routes.ts`, `storage.ts`, `auth.ts`.

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema**: Shared `shared/schema.ts`
- **Key Entities**: Users, Categories, Products, Pricing tiers, Designs, Carts, Orders, Promotions, Site settings.

### Authentication
- Email/password with bcrypt, optional Google OAuth.
- Session-based authentication with 1-week TTL.
- Admin role management.

### Build System
- **Development**: Vite dev server with HMR proxying to Express.
- **Production**: Vite builds to `dist/public`, esbuild for server.
- **Path Aliases**: `@/` (client), `@shared/` (shared).

### UI/UX Decisions
- Mobile-first design for the unified editor (in `next-app`).
- Upload+preview workflow for design, similar to StickerApp.com.
- Distinct styling for AI bot (orange) vs. human support (green) in chat.

### Feature Specifications
- **Customer Artwork Upload**: API endpoint for uploading artwork (JPG, PNG, GIF, WebP, SVG, PDF up to 50MB) to `/uploads/artwork/`.
- **Live Chat Support**: Real-time chat widget with polling, message history, and admin interface for support.
- **Order Tracking**: Detailed order views with timeline, shipping, items, and print-ready downloads.
- **Hot Deals**: Dynamic display of promotional products on homepage and a dedicated deals page.
- **Deals Management System**: Admin CRUD for managing deals with scheduling and display options.
- **Product Template System**: Admin management of reusable product templates with Fabric.js canvas JSON storage.
- **Admin Users Management**: Comprehensive user list with order statistics and role management.
- **Admin Finances Dashboard**: Overview of revenue, order count, average order value, and recent transactions.
- **Admin Support Inbox with AI Escalation**: Shared inbox for escalated customer conversations, AI detects human support requests, distinct styling for AI vs. human responses.
- **Simplified Upload+Preview Editor (next-app)**: User uploads artwork, system displays preview with bleed border, auto-detects dimensions, calculates size, floating animation, material/coating/quantity selection, live price calculation. Stores designs in Vercel Blob.
- **Enhanced Order Management**: Comprehensive order details in admin modal and customer view, including full customer info, shipping address, detailed items with selected options, design files, financial summary, tracking, and notes. Checkout stores `userId`, `shippingAddress`, `designId`, `selectedOptions`, and payment ID.
- **Itemized Add-On Pricing**: Product options (material, coating) with associated costs are itemized in quotes and included in cart unit prices.
- **Checkout Price Handling**: Robust handling of null/zero unit prices for free products and proper calculation of subtotals.

### Dual Codebase
- **Production**: Next.js app in `next-app/`.
- **Development**: Vite+Express app in root `client/` and `server/`.

## External Dependencies

### Third-Party Services
- **Stripe**: Payment processing (pending configuration).
- **Google OAuth**: Optional social login.

### Database
- **PostgreSQL**: Primary database.
- **Neon Serverless**: PostgreSQL driver for serverless environments.

### Key Libraries
- **Fabric.js**: Canvas manipulation (used in Vite+Express version for design editor, largely replaced by simplified editor in `next-app`).
- **PDFKit**: Server-side PDF generation.
- **Multer**: File upload handling.
- **Zod**: Runtime schema validation.