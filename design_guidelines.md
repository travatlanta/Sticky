# Design Guidelines: Sticky Banditos Printing Company

## Design Approach

**Selected Approach**: Reference-Based with Outlaw/Bandit Theme

Drawing inspiration from creative agency websites (e.g., Awwwards-featured studios, Unsplash, Dribbble) while infusing a bold, rebellious outlaw aesthetic. The design balances professional credibility with playful bandit personality—think modern western meets contemporary print shop.

**Design Principles**:
- Bold, unapologetic visual presence
- Showcase printing craftsmanship through high-quality imagery
- Playful yet trustworthy brand personality
- Portfolio-first approach highlighting work quality

## Typography

**Font System** (via Google Fonts):

Primary Headings: "Bebas Neue" or "Oswald" (bold, impactful, western-inspired)
- H1: text-6xl md:text-8xl font-bold
- H2: text-4xl md:text-6xl font-bold
- H3: text-2xl md:text-4xl font-bold

Body Text: "Inter" or "Work Sans" (clean, professional readability)
- Body: text-base md:text-lg
- Small: text-sm
- Captions: text-xs uppercase tracking-wider

## Layout System

**Spacing Primitives**: Use Tailwind units of 4, 6, 8, 12, 16, 20, 24, 32
- Section padding: py-16 md:py-24 lg:py-32
- Component spacing: gap-8 md:gap-12
- Element spacing: p-4, p-6, p-8
- Container: max-w-7xl mx-auto px-4 md:px-8

**Grid Strategy**:
- Hero: Full-width with max-w-7xl content
- Services: 3-column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Portfolio: Masonry-style grid (grid-cols-2 md:grid-cols-3 lg:grid-cols-4)
- Testimonials: 2-column (grid-cols-1 lg:grid-cols-2)

## Component Library

### Navigation
Sticky header with logo left, main nav center, "Get Quote" CTA right
- Desktop: Horizontal menu with hover underline effects
- Mobile: Hamburger menu with full-screen overlay
- Icons: Heroicons (outline style)

### Hero Section
Full-viewport hero (min-h-screen) with large background image showcasing premium sticker/print work
- Headline overlay with semi-transparent backdrop (backdrop-blur-md bg-black/40)
- Primary CTA: "Get Custom Quote" with blurred background button
- Secondary text: Brief value proposition
- Scroll indicator at bottom

### Services Section
3-column grid featuring core offerings:
- Custom Stickers
- Labels & Decals
- Large Format Prints
- Business Branding
- Vinyl Graphics
- Specialty Finishes

Each card includes icon (Heroicons), service title, brief description, "Learn More" link

### Portfolio Gallery
Image-heavy masonry grid showcasing finished products:
- Mix of product shots, in-situ applications, close-ups
- Hover overlay with project name and category
- Lightbox modal for enlarged views
- Filter tabs by category (Stickers, Labels, Apparel, Signage)

### Quote Request Form
Prominent 2-column layout:
- Left: Form fields (name, email, phone, project type dropdown, quantity, description textarea, file upload for artwork)
- Right: Quick info card with turnaround times, pricing starting points, contact info
- Large "Submit Quote Request" button

### Testimonials Section
2-column grid with customer reviews:
- Customer name, company, star rating
- Quote text
- Optional customer logo or photo

### Footer
3-column layout:
- Column 1: Logo, tagline, social links
- Column 2: Quick links (Services, Portfolio, About, Contact)
- Column 3: Contact info, business hours, newsletter signup
- Bottom bar: Copyright, privacy policy

## Images

**Hero Image**: Large, high-quality hero showcasing a collection of vibrant custom stickers or a print installation. Image should communicate quality, creativity, and professional craftsmanship. Consider a workspace shot with designs being applied or a stunning collection of finished products.

**Portfolio Images**: 12-20 high-resolution images of completed printing projects including:
- Close-up product shots of stickers and labels
- Stickers applied to laptops, water bottles, vehicles
- Business branding materials (business cards, packaging)
- Large format prints and signage
- Before/after application shots

**Service Icons**: Use Heroicons for service cards (printer, tag, square-stack, photo, paint-brush icons)

## Special Design Elements

**Bandit Theme Integration**:
- Subtle wanted-poster aesthetic in service cards (distressed borders, aged paper texture)
- Playful "Stick 'Em Up" or "Ride with the Banditos" microcopy throughout
- Badge/sheriff star shapes for trust indicators ("Licensed & Insured", "Fast Turnaround")
- Western-inspired decorative dividers between sections

**Interactive Elements**:
- Smooth scroll to section anchors
- Image hover zoom effects in portfolio
- Form field focus states with border emphasis
- Subtle parallax on hero background (minimal, tasteful)

**Trust Signals**:
- Client logo strip below hero
- Metrics counter (Projects Completed, Happy Customers, Years in Business)
- Industry certifications or awards badges in footer

This design positions Sticky Banditos as a bold, creative, professional printing partner that doesn't take itself too seriously while delivering exceptional quality.