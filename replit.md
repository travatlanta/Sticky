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
- **Authentication**: Replit Auth via OpenID Connect with Passport.js
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

The server uses a modular structure:
- `routes.ts` - API endpoint definitions
- `storage.ts` - Data access layer abstraction
- `replitAuth.ts` - Authentication middleware and session handling
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
- Replit Auth (OpenID Connect) for user authentication
- Session-based auth with PostgreSQL session store
- Admin role checking middleware for protected routes
- 1-week session TTL with secure cookies

### Build System
- **Development**: Vite dev server with HMR proxying to Express
- **Production**: Vite builds to `dist/public`, esbuild bundles server
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

## External Dependencies

### Third-Party Services
- **Stripe**: Payment processing (initialized when `STRIPE_SECRET_KEY` is set)
- **Replit Auth**: OpenID Connect authentication via `openid-client`

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
- `REPL_ID` - Replit environment identifier
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

## Pending Configuration

### Stripe Payment Integration
- **Status**: Not configured - user wants to set this up later
- **Required secrets**: `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY`
- **Backend ready**: Payment intent creation endpoint exists at `/api/checkout/create-payment-intent`
- **Frontend needed**: Checkout page with Stripe Elements when keys are provided