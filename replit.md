# Sticky Banditos Printing Company

## Overview

Sticky Banditos is a custom printing e-commerce platform that allows customers to design and order custom print products like stickers, business cards, and flyers. The application features a customer-facing storefront with product browsing, an integrated design editor using Fabric.js, shopping cart functionality, and a comprehensive admin panel for managing products, orders, and promotions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom theme configuration
- **Component Library**: shadcn/ui components built on Radix UI primitives
- **Design Editor**: Fabric.js canvas library for custom product design

The frontend follows a page-based architecture with shared components. Key pages include:
- Landing/Home pages for marketing and dashboard
- Products catalog with category filtering
- Product detail with dynamic pricing calculator
- Canvas-based design editor
- Shopping cart and orders management
- Admin dashboard with full CRUD capabilities

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Design**: RESTful JSON APIs under `/api` prefix
- **Authentication**: Custom Passport.js with email/password and optional Google OAuth
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

The server uses a modular structure:
- `routes.ts` - API endpoint definitions
- `storage.ts` - Data access layer abstraction
- `auth.ts` - Authentication middleware, login/register endpoints, admin management
- `vite.ts` - Development server integration

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command

Key data entities:
- Users with admin roles
- Categories and Products with configurable options
- Pricing tiers for quantity-based pricing
- Designs with canvas JSON storage
- Shopping carts and cart items
- Orders with status tracking
- Promotions and site settings

### Authentication
- Custom email/password authentication with bcrypt password hashing
- Optional Google OAuth login (requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
- Session-based auth with PostgreSQL session store
- Admin role checking middleware for protected routes
- 1-week session TTL with secure cookies
- Admin management: invite admins via email, revoke admin access

### Build System
- **Development**: Vite dev server with HMR proxying to Express
- **Production**: Vite builds to `dist/public`, esbuild bundles server
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

## External Dependencies

### Third-Party Services
- **Stripe**: Payment processing (initialized when `STRIPE_SECRET_KEY` is set)
- **Google OAuth**: Optional social login (requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`)

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **Neon Serverless**: PostgreSQL driver for serverless environments (`@neondatabase/serverless`)

### Key Libraries
- **Fabric.js**: Canvas manipulation for the design editor
- **PDFKit**: Server-side PDF generation
- **Multer**: File upload handling
- **Zod**: Runtime schema validation

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional, for Google login)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional, for Google login)
- `STRIPE_SECRET_KEY` - Stripe API key (optional)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for frontend (optional)

## Recent Features

### Customer Artwork Upload
- **API Endpoint**: `POST /api/upload/artwork` - uploads customer artwork files
- **Storage**: Files saved to `/uploads/artwork/` directory
- **Limits**: 50MB max file size, supports JPG, PNG, GIF, WebP, SVG, PDF
- **Integration**: Editor page uploads artwork to server before adding to canvas

### Live Chat Support
- **Component**: `ChatWidget.tsx` - floating chat widget in bottom-right corner
- **API Endpoints**:
  - `GET /api/messages` - get user's messages
  - `POST /api/messages` - send a new message
  - `GET /api/admin/messages` - get all unread messages (admin)
  - `POST /api/admin/messages/reply` - reply to user (admin)
  - `PUT /api/messages/:id/read` - mark message as read
- **Features**: Real-time polling (5s), message history, support/user distinction

### Order Tracking
- **Page**: `/orders/:id` - detailed order view with status tracking
- **Features**: Order timeline, shipping info, order items summary, status badges
- **Print-Ready Downloads**: Order detail page shows download buttons for:
  - High-resolution design exports (`highResExportUrl`)
  - Custom shape files for die-cut stickers (`customShapeUrl`)
  - Design preview thumbnails inline with order items

### Hot Deals on Products Page
- **Component**: Products page (`/products`) displays Hot Deals section at top
- **Data Source**: Fetches from `/api/deals/homepage` endpoint
- **Features**: Orange/red gradient cards, discount percentage badges, CTA buttons

### Deals Management System
- **Database**: `deals` table with title, description, pricing, images, CTA links, badges, scheduling
- **Admin Panel**: Deals management is now integrated into `/admin/products` with a tabbed interface (Products | Hot Deals)
- **Customer Pages**: 
  - Homepage Hot Deals section with dynamic cards from `/api/deals/homepage`
  - `/deals` page showing all active published deals
- **API Endpoints**:
  - `GET /api/deals` - get all published deals
  - `GET /api/deals/homepage` - get deals marked for homepage display
  - `GET /api/admin/deals` - get all deals (admin)
  - `POST /api/admin/deals` - create deal (admin)
  - `PUT /api/admin/deals/:id` - update deal (admin)
  - `DELETE /api/admin/deals/:id` - delete deal (admin)
- **Features**: Quantity/size badges, original vs deal pricing, percentage off calculation, expiration dates, CTA buttons with custom links

### Product Template System
- **Database**: `product_templates` table with name, description, preview image, Fabric.js canvas JSON
- **Admin Panel**: Templates managed via tabs in product edit modal at `/admin/products`
- **API Endpoints**:
  - `GET /api/admin/products/:productId/templates` - get templates for a product (admin)
  - `POST /api/admin/products/:productId/templates` - create template (admin)
  - `PUT /api/admin/templates/:id` - update template (admin)
  - `DELETE /api/admin/templates/:id` - delete template (admin)
  - `GET /api/products/:productId/templates` - get active templates for customer view
- **Features**: Preview images, Fabric.js canvas JSON storage, active/inactive toggle, per-product association
- **File Storage**: Template preview images stored in `/uploads/templates/`

### Admin Users Management
- **Page**: `/admin/users` - user management with tabbed interface
- **Tabs**: All Users, Subscribers (no orders), Purchasers (has orders), Admins
- **API Endpoint**: `GET /api/admin/users` - returns users with order stats (orderCount, totalSpent, hasOrders)
- **Features**: User lists with order history, email display, admin badges

### Admin Finances Dashboard
- **Page**: `/admin/finances` - financial overview and reporting
- **API Endpoint**: `GET /api/admin/finances` - returns financial overview
- **Data Provided**: totalRevenue, orderCount, averageOrderValue, revenueByStatus (paid/pending/delivered/cancelled), recentOrders list
- **Features**: Revenue cards, status-based breakdown, recent transactions table

### Admin Support Inbox with AI Escalation
- **Page**: `/admin/inbox` - shared admin inbox for escalated customer conversations
- **Database Fields**: `messages` table extended with:
  - `needsHumanSupport` (boolean) - flags conversations needing human attention
  - `escalatedAt` (timestamp) - when escalation occurred
  - `isFromHuman` (boolean) - distinguishes AI bot vs human admin responses
- **API Endpoints**:
  - `GET /api/admin/inbox` - get all escalated conversations (admin)
  - `GET /api/admin/inbox/:userId` - get conversation history for user (admin)
  - `POST /api/admin/messages/reply` - human admin reply (auto-resolves escalation)
- **AI Escalation Detection**: The AI chatbot automatically detects when customers request human support using phrases like:
  - "speak to a person", "talk to human", "real person", "need help from a human"
  - When detected, AI responds with escalation message and marks conversation
- **ChatWidget Integration**: Displays different styling for AI bot responses (orange) vs human support team responses (green) with distinct icons and labels
- **Features**: 
  - Conversation list with "Needs Reply" badges
  - Full message history view
  - Reply functionality that auto-resolves escalation
  - Real-time polling for new messages

### Enhanced Design Editor (Print-Ready)
- **Canvas Sizing**: Dynamic canvas dimensions based on product specifications (width/height in inches, DPI)
- **Database Fields**: Products table extended with:
  - `widthInches`, `heightInches` (decimal) - physical print dimensions
  - `dpi` (integer, default 300) - print resolution
  - `bleedSize` (decimal, default 0.125") - bleed offset for printing
  - `safeZoneSize` (decimal, default 0.25") - safe zone inside bleed
  - `supportsCustomShape` (boolean) - enables die-cut sticker uploads
- **Visual Guides**:
  - Red dashed bleed line shows printer margin area
  - Green dashed safe zone line shows content boundary
  - Guides stay on top when adding objects (event listeners reorder z-index)
  - Guides update position correctly during zoom operations
- **Zoom Controls**: Zoom in/out buttons with percentage display, mobile-friendly
- **Die-Cut Stickers**: Modal prompt for custom shape upload when product supports it
- **High-Res Export**: 3x scale factor export when adding to cart, stored as `highResExportUrl` on designs
- **Admin Order View**: Order details modal shows design previews with links to:
  - High-resolution export file
  - Custom shape file (for die-cut stickers)
  - Design name and preview thumbnail

### Enhanced Order Management
- **Admin Order Modal**: Comprehensive order details including:
  - Customer Information: Name, email, phone from user account
  - Full Shipping Address with all address fields
  - Order Items: Product name, quantity, unit price, subtotal, selected options
  - Design Files: Preview thumbnail, Download Print File, Download Die-Cut Shape, Production File buttons
  - Financial Summary: Subtotal, shipping, tax, discounts, total
  - Tracking: Input for tracking number with save button
  - Order Notes display
- **Checkout Enhancement**: Now stores:
  - `userId` from authenticated session
  - `shippingAddress` JSON with all customer address fields
  - `designId` on order items for design linkage
  - `selectedOptions` on order items for product configuration
  - Square payment ID for reference
- **Customer Order Page** (`/orders/[id]`): Full order details with:
  - Order items with product info and selected options
  - Print-ready file download buttons
  - Shipping address, tracking info, order summary

## Pending Configuration

### Stripe Payment Integration
- **Status**: Not configured - user wants to set this up later
- **Required secrets**: `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY`
- **Backend ready**: Payment intent creation endpoint exists at `/api/checkout/create-payment-intent`
- **Frontend needed**: Checkout page with Stripe Elements when keys are provided