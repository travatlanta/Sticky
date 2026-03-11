import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  UnderlineType,
  PageBreak,
  ExternalHyperlink,
  convertInchesToTwip,
  LevelFormat,
  NumberFormat,
  StyleLevel,
} from "docx";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "GROWTH_MASTER_PLAN.docx");

// ─── Colour palette ───────────────────────────────────────────────────────────
const BRAND_RED    = "C0392B"; // Sticky Banditos accent
const BRAND_DARK   = "1A1A2E"; // deep navy / almost black
const BRAND_LIGHT  = "F5F5F5"; // light grey for table headers
const WHITE        = "FFFFFF";
const ACCENT_BLUE  = "2980B9";
const ACCENT_GREEN = "27AE60";
const BODY_GREY    = "444444";

// ─── Helper: plain body paragraph ────────────────────────────────────────────
function body(text, { bold = false, color = BODY_GREY, size = 22, spacing = 160 } = {}) {
  return new Paragraph({
    spacing: { after: spacing },
    children: [
      new TextRun({ text, bold, color, size, font: "Calibri" }),
    ],
  });
}

// ─── Helper: section heading (H2 style) ──────────────────────────────────────
function sectionHead(text) {
  return new Paragraph({
    spacing: { before: 360, after: 120 },
    border: { bottom: { color: BRAND_RED, size: 12, space: 6, style: BorderStyle.SINGLE } },
    children: [
      new TextRun({
        text,
        bold: true,
        color: BRAND_DARK,
        size: 30,
        font: "Calibri",
        allCaps: true,
      }),
    ],
  });
}

// ─── Helper: sub-heading (H3 style) ──────────────────────────────────────────
function subHead(text) {
  return new Paragraph({
    spacing: { before: 260, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        color: BRAND_RED,
        size: 26,
        font: "Calibri",
      }),
    ],
  });
}

// ─── Helper: sub-sub-heading (H4 style) ──────────────────────────────────────
function subSubHead(text) {
  return new Paragraph({
    spacing: { before: 200, after: 60 },
    children: [
      new TextRun({
        text,
        bold: true,
        color: BRAND_DARK,
        size: 22,
        font: "Calibri",
      }),
    ],
  });
}

// ─── Helper: stat callout (highlighted fact line) ────────────────────────────
function stat(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    shading: { type: ShadingType.SOLID, color: "FEF9E7" },
    indent: { left: convertInchesToTwip(0.25), right: convertInchesToTwip(0.25) },
    border: {
      left: { color: BRAND_RED, size: 18, space: 8, style: BorderStyle.SINGLE },
    },
    children: [
      new TextRun({ text: "● ", color: BRAND_RED, bold: true, size: 20, font: "Calibri" }),
      new TextRun({ text, color: "222222", size: 20, font: "Calibri" }),
    ],
  });
}

// ─── Helper: bullet point ─────────────────────────────────────────────────────
function bullet(text, { indent = 0 } = {}) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: convertInchesToTwip(0.35 + indent * 0.25) },
    children: [
      new TextRun({ text: "• ", color: BRAND_RED, bold: true, size: 22, font: "Calibri" }),
      new TextRun({ text, color: BODY_GREY, size: 22, font: "Calibri" }),
    ],
  });
}

// ─── Helper: checkbox-style item ─────────────────────────────────────────────
function checkItem(text) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: convertInchesToTwip(0.3) },
    children: [
      new TextRun({ text: "☐  ", color: ACCENT_BLUE, bold: true, size: 22, font: "Calibri" }),
      new TextRun({ text, color: BODY_GREY, size: 22, font: "Calibri" }),
    ],
  });
}

// ─── Helper: spacer ──────────────────────────────────────────────────────────
function spacer(size = 200) {
  return new Paragraph({ spacing: { after: size }, children: [] });
}

// ─── Helper: page break ──────────────────────────────────────────────────────
function pgBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ─── Helper: note / tip box ──────────────────────────────────────────────────
function tipBox(text) {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    shading: { type: ShadingType.SOLID, color: "EAF4FB" },
    indent: { left: convertInchesToTwip(0.25), right: convertInchesToTwip(0.25) },
    border: {
      left: { color: ACCENT_BLUE, size: 18, space: 8, style: BorderStyle.SINGLE },
    },
    children: [
      new TextRun({ text: "TIP  ", color: ACCENT_BLUE, bold: true, size: 20, font: "Calibri" }),
      new TextRun({ text, color: "222222", size: 20, font: "Calibri" }),
    ],
  });
}

// ─── Helper: simple data table ────────────────────────────────────────────────
function dataTable(headers, rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) =>
      new TableCell({
        shading: { type: ShadingType.SOLID, color: BRAND_DARK },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: h, bold: true, color: WHITE, size: 20, font: "Calibri" }),
            ],
          }),
        ],
      })
    ),
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell) =>
        new TableCell({
          shading: { type: ShadingType.SOLID, color: ri % 2 === 0 ? BRAND_LIGHT : WHITE },
          margins: { top: 70, bottom: 70, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: String(cell), color: BODY_GREY, size: 20, font: "Calibri" }),
              ],
            }),
          ],
        })
      ),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.15) },
  });
}

// ─── Cover page ──────────────────────────────────────────────────────────────
function coverPage() {
  return [
    spacer(1200),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: "STICKY BANDITOS",
          bold: true,
          color: BRAND_RED,
          size: 64,
          font: "Calibri",
          allCaps: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: "Complete Growth & Marketing Master Plan",
          bold: false,
          color: BRAND_DARK,
          size: 36,
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: "Research-backed. No guessing. Built on real data.",
          italics: true,
          color: "888888",
          size: 24,
          font: "Calibri",
        }),
      ],
    }),
    spacer(400),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: {
        top: { color: BRAND_RED, size: 6, style: BorderStyle.SINGLE },
        bottom: { color: BRAND_RED, size: 6, style: BorderStyle.SINGLE },
      },
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({
          text: "Compiled March 2026  |  Confidential",
          color: "888888",
          size: 20,
          font: "Calibri",
        }),
      ],
    }),
    pgBreak(),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DOCUMENT ASSEMBLY
// ═══════════════════════════════════════════════════════════════════════════════
const children = [
  // ── COVER ──────────────────────────────────────────────────────────────────
  ...coverPage(),

  // ── THE HARD TRUTH ─────────────────────────────────────────────────────────
  sectionHead("The Hard Truth First"),
  body(
    "All the growth tactics in the world — reviews, subscriptions, SEO — are dead weight without a steady flow of customers. StickerMule built a $500M+ business because they made ordering stickers dead simple, made the quality undeniable, and then let the volume do the rest. This plan is built around that same logic:"
  ),
  body(
    "Get real customers in the door first. Then work every angle to keep them and grow them.",
    { bold: true, color: BRAND_DARK, size: 24 }
  ),
  spacer(),
  body("This plan is broken into two major parts:", { bold: true }),
  bullet("Part 1 — The Foundation: things that make your ad spend work and stop leaking money"),
  bullet("Part 2 — The Ads & Marketing Engine: the biggest section, because this is what actually generates orders"),

  pgBreak(),

  // ══════════════════════════════════════════════════════════════════════════
  //  PART 1 — FOUNDATION
  // ══════════════════════════════════════════════════════════════════════════
  sectionHead("Part 1: The Foundation — Do This Before Spending On Ads"),
  body(
    "These systems are prerequisites. Running ads without them is pouring water into a bucket with holes."
  ),
  spacer(100),

  // 1A Reviews
  subHead("1A. Customer Reviews System"),
  body("The data:", { bold: true }),
  stat("87% of consumers read reviews before buying (Birdeye)"),
  stat("50% read more than 5 reviews before deciding"),
  stat("Adding Google Seller Ratings to Google Ads: 48.4% higher conversion rate + 19% cheaper CPA"),
  stat("Review request emails get 69% open rates when sent right after delivery"),
  spacer(100),
  body("What to build:", { bold: true }),
  bullet("Automated post-delivery email at T+7 days: 'How do your stickers look?' → link directly to Google Reviews"),
  bullet("Add star rating display sitewide once you have 10+ reviews"),
  bullet("Respond to every review publicly — it signals to future buyers you're active"),
  bullet("Screenshot the best reviews and use them in ad creative immediately"),
  spacer(100),
  tipBox("Every dollar spent on ads is cheaper once you have reviews. This is a permanent multiplier on everything else."),
  spacer(),

  // 1B Abandoned Cart
  subHead("1B. Abandoned Cart Recovery Email Sequence"),
  body("The data:", { bold: true }),
  stat("70% of all ecommerce carts are abandoned (Shopify/Klaviyo)"),
  stat("Cart recovery emails recover 3.33% of lost revenue"),
  stat("Average recovered revenue: $3.65 per email sent to abandoned cart recipients"),
  stat("Best sequence timing: 1 hour → 24 hours → 72 hours"),
  spacer(100),
  body("Resend is already integrated in your codebase. Build these three emails:", { bold: true }),
  bullet("Email 1 (1 hour): Friendly reminder — 'You left something behind.' Product photo, name, price. No discount yet."),
  bullet("Email 2 (24 hours): Social proof — 'Others loved this' + a review quote. Still no discount."),
  bullet("Email 3 (72 hours): Final offer — 'Here's 10% off to get started.' Expires in 24 hours."),
  spacer(80),
  body("Cart value strategy:", { bold: true }),
  bullet("Under $50: Reminder only"),
  bullet("$50–$150: Free shipping offer"),
  bullet("$150+: Personal note + discount code"),
  spacer(80),
  tipBox("This sequence pays for itself within the first month. Build it before you spend a single dollar on ads."),
  spacer(),

  // 1C Pixels
  subHead("1C. Install All Tracking Pixels (Critical Before Ad Spend)"),
  body(
    "You cannot optimize ads you cannot measure. Before spending on paid ads, install all four of these in your Next.js layout.tsx:"
  ),
  bullet("Meta Pixel — tracks page views, add-to-carts, purchases. Required for Facebook/Instagram retargeting."),
  bullet("Google Analytics 4 Tag + Google Ads Conversion Tracking — tracks which search terms lead to purchases."),
  bullet("TikTok Pixel — tracks conversions (required to run TikTok conversion campaigns)."),
  bullet("Pinterest Tag — tracks add-to-carts and purchases. Required for Shopping Ads optimization."),
  spacer(80),
  tipBox("All four tags go in next-app/app/layout.tsx in the <head>. This takes one afternoon and unlocks retargeting on every platform."),
  spacer(),

  // 1D Mobile
  subHead("1D. Mobile Experience Audit (You're 90% Mobile)"),
  body("Before ads go live, verify on a real phone:"),
  bullet("Checkout completes without errors in under 2 minutes"),
  bullet("Product pages load in under 2 seconds on 4G"),
  bullet("Cart persists across sessions"),
  bullet("Images are sharp on Retina displays"),
  bullet("'Add to Cart' button is visible above the fold without scrolling"),
  spacer(80),
  body(
    "Ad platforms penalize slow mobile experiences by raising your bid costs. Fix this first.",
    { color: BRAND_RED, bold: true }
  ),

  pgBreak(),

  // ══════════════════════════════════════════════════════════════════════════
  //  PART 2 — ADS & MARKETING
  // ══════════════════════════════════════════════════════════════════════════
  sectionHead("Part 2: The Ads & Marketing Engine"),

  subHead("Platform Scorecard — What The Data Says"),
  spacer(80),
  dataTable(
    ["Platform", "Avg CPC", "Avg CPM", "Best For"],
    [
      ["Google Search (niche)", "$1–$5", "N/A", "High-intent buyers"],
      ["Google Shopping", "$0.25–$3", "N/A", "Product image discovery"],
      ["Google Remarketing", "$0.25–$3", "N/A", "Warm visitors — highest ROI"],
      ["Meta (Facebook)", "$0.87", "$16.06", "Retargeting, lookalike audiences"],
      ["Instagram Reels", "$0.97 est.", "$9.38 est.", "Visual discovery — 34.5% cheaper than feed"],
      ["TikTok", "$0.02–$2", "$3.21", "Mass reach — cheapest CPM available"],
      ["Pinterest Shopping", "$0.10 or less", "$1.50 or less", "Visual planning, high purchase intent"],
    ]
  ),
  spacer(200),
  body(
    "Key insight: Stickers are visual, impulse products under $50 bought by a social-media-savvy audience. That maps perfectly to Meta retargeting, TikTok organic + paid, Pinterest Shopping, and Google for purchase-intent search terms.",
    { bold: true, color: BRAND_DARK }
  ),

  spacer(300),

  // ── PHASE 1 ───────────────────────────────────────────────────────────────
  subHead("Phase 1 — Get The First Orders Rolling (Weeks 1–6)"),
  body(
    "Budget: $300–$400/month",
    { bold: true, color: ACCENT_GREEN, size: 24 }
  ),
  body(
    "The goal here is NOT to be profitable on ads immediately. The goal is to generate real orders, get reviews, build pixel data, and find your first $5 that turns into $10."
  ),
  spacer(100),

  subSubHead("Step 1: Google Remarketing + Performance Max ($150–$200/month)"),
  body(
    "Remarketing targets people who already visited Sticky Banditos. They've seen the products — they just didn't buy. Only 2% of people convert on their first visit. The other 98% need to see you again."
  ),
  stat("Remarketing CPC: $0.25–$3 — the cheapest paid click you'll ever buy"),
  spacer(80),
  body("How to set it up:", { bold: true }),
  bullet("Create a Google Ads account and install the global site tag in layout.tsx"),
  bullet("Create a remarketing audience: 'All website visitors in the last 30 days'"),
  bullet("Run a simple remarketing campaign: product photo + punchy headline + 'Get yours today' CTA"),
  bullet("Run at $10/day for 3 weeks before judging performance"),
  spacer(80),
  body("Then add Performance Max ($50–$100/month):", { bold: true }),
  body(
    "Performance Max uses machine learning to show ads across Google Search, Shopping, YouTube, Display, and Gmail simultaneously — all from one campaign. It is the easiest entry point into Google Shopping (which shows product images + prices right in search results) for ecommerce beginners."
  ),
  spacer(120),

  subSubHead("Step 2: Meta (Facebook + Instagram) Retargeting ($100–$150/month)"),
  stat("Average Facebook CPC: $0.87 — cheaper than Google and Instagram"),
  stat("Instagram Reels ads: 34.5% cheaper per placement than image ads"),
  stat("Stories = 41% of all Instagram ad impressions"),
  spacer(80),
  body("How to set it up:", { bold: true }),
  bullet("Install the Meta Pixel and create a Business Manager account at business.facebook.com"),
  bullet("Create a Custom Audience: 'All website visitors last 30 days'"),
  bullet("Run a retargeting campaign: objective = Sales → Conversions"),
  bullet("Ad format: Instagram Reels (vertical, 15–30 seconds, authentic iPhone feel)"),
  bullet("Budget: $5–$8/day"),
  spacer(80),
  body("Placement breakdown:", { bold: true }),
  bullet("Reels (26% of impressions): Brand awareness. Hook in first 2 seconds.", { indent: 1 }),
  bullet("Stories (41% of impressions): Full-screen. Great for abandoned cart retargeting.", { indent: 1 }),
  bullet("Feed Carousel (29% of impressions): Show 4–5 sticker types side by side. Conversion ad.", { indent: 1 }),
  spacer(80),
  tipBox("Critical: Make it look like organic content, not like a polished ad. Over-produced content gets skipped. Real iPhone footage wins on Meta/Instagram."),
  spacer(120),

  subSubHead("Step 3: One Niche Google Search Campaign ($50–$100/month)"),
  body(
    "Generic terms like 'custom stickers' are dominated by StickerMule with massive budgets. Don't compete there yet. Target niche search terms with lower competition:"
  ),
  bullet("'holographic stickers for small business'"),
  bullet("'custom die cut stickers bands'"),
  bullet("'custom vinyl stickers skateboarding'"),
  bullet("'custom stickers for water bottles'"),
  spacer(80),
  body("Ad copy formula:", { bold: true }),
  bullet("Headline 1: 'Custom [Niche] Stickers — Ready in Days'"),
  bullet("Headline 2: 'Die-Cut, Holographic, Glitter Options'"),
  bullet("Headline 3: 'Free Samples Available | Ships Fast'"),
  spacer(120),

  subSubHead("Phase 1 Budget Breakdown"),
  spacer(80),
  dataTable(
    ["Channel", "Monthly Budget", "Goal"],
    [
      ["Google Remarketing", "$100", "Re-capture site visitors"],
      ["Performance Max", "$75", "Google Shopping exposure"],
      ["Meta / Instagram Retargeting", "$150", "Social retargeting"],
      ["Niche Google Search", "$75", "Purchase-intent traffic"],
      ["TOTAL", "$400/month", "First 20 real orders"],
    ]
  ),
  spacer(200),
  body("What success looks like in Phase 1:", { bold: true }),
  bullet("10–20 orders attributable to paid ads"),
  bullet("Pixel audiences building on all platforms"),
  bullet("First Google and Meta reviews coming in"),
  bullet("Abandoned cart sequence recovering 3–5% of carts"),
  bullet("Knowing which sticker type (die-cut, holographic, glitter) has lowest cost-per-acquisition"),

  pgBreak(),

  // ── PHASE 2 ───────────────────────────────────────────────────────────────
  subHead("Phase 2 — Build The Machine (Months 2–3)"),
  body(
    "Budget: $800–$1,000/month",
    { bold: true, color: ACCENT_GREEN, size: 24 }
  ),
  body(
    "Now you have data: real orders, real reviews, real pixel audiences. Time to widen the net."
  ),
  spacer(100),

  subSubHead("2A. TikTok — The Organic + Paid Flywheel"),
  stat("39% of TikTok users purchase products they discovered on TikTok"),
  stat("TikTok CPM: $3.21 vs Meta's $16.06 — 5x cheaper per 1,000 impressions"),
  stat("Nano-influencers (1K–10K followers) average 15% engagement on TikTok"),
  spacer(80),
  body("The strategy: organic first, then Spark Ads.", { bold: true }),
  body(
    "TikTok rewards organic content more aggressively than any other platform. A single great video can get 50,000 views with zero ad spend. Start organic, then boost what works."
  ),
  spacer(80),
  body("Content pillars (post 3x/week):", { bold: true }),
  bullet("'How It's Made' — Laminator laying down holographic film. Die-cut punch sheet. Peel-off backing. People are obsessed with watching things being made."),
  bullet("Unboxing content — Film a first-time customer opening their order. 'Reaction to my custom sticker order' performs massively."),
  bullet("Use case + humor — 'POV: you put your sticker on a water bottle and three people ask where you got it.'"),
  bullet("Design reveals — 'My client sent me this design... here's what we made it into.' Transformation content is addictive."),
  spacer(80),
  body("Then: Spark Ads ($150/month)", { bold: true }),
  body(
    "Once a video gets strong organic engagement, promote it as a Spark Ad. Spark Ads boost existing organic content so it maintains the authentic 'real content' feel that converts better than studio ads. You're amplifying what already worked — not spending to test from scratch."
  ),
  spacer(80),
  body("TikTok creative rules (from research):", { bold: true, color: BRAND_RED }),
  bullet("Hook in first 2 seconds. Test 5 different hooks for every concept."),
  bullet("Film vertical on iPhone. Native TikTok fonts. No overproduction."),
  bullet("Feature a specific offer in caption: '50 custom stickers, $X'"),
  bullet("CTR below 0.5% after 2,000 impressions = kill the creative"),
  spacer(120),

  subSubHead("2B. Pinterest Shopping Ads ($100–$150/month)"),
  body(
    "Pinterest is the hidden gem for Sticky Banditos. Stickers are a visual product. Aesthetic sticker sheets, holographic designs, custom packaging — this is exactly the content Pinterest users save for future purchases."
  ),
  spacer(80),
  stat("570 million monthly active users"),
  stat("Pinterest users spend 26% more per year than non-Pinners"),
  stat("Shopping Pins: 15% higher ROAS + 2.6x higher conversion rate than standard pins"),
  stat("CPC as low as $0.10, CPM as low as $1.50"),
  stat("One in five shoppers trust Pinterest results more than Google results"),
  spacer(80),
  body("How to set it up:", { bold: true }),
  bullet("Create Pinterest Business account and install Pinterest Tag"),
  bullet("Upload your product catalog from the admin panel"),
  bullet("Run Shopping Pins — these show product image, name, and price in search results"),
  bullet("Target: interests in 'stickers,' 'custom gifts,' 'small business,' 'band merch', 'art supplies'"),
  bullet("Use automated bidding (Performance+) to start, $5–$10/day"),
  spacer(80),
  tipBox("Pinterest pins have a long shelf life. Unlike Instagram (content dies in 24 hours), a well-optimized Pinterest pin can drive traffic for months — even years. Use keyword-rich descriptions."),
  spacer(120),

  subSubHead("2C. Micro-Influencer Product Gifting Program"),
  stat("$6.50 ROI for every $1 spent on influencer marketing (Tomoson survey)"),
  stat("84.8% of brands find influencer marketing effective"),
  stat("31% of social media users discover new products through influencers"),
  stat("64% of marketers work with micro-influencers; 47% had their most success with them"),
  spacer(80),
  body(
    "Stickers are literally the cheapest product you can gift to an influencer. Your COGS is minimal, so you can send packs to 20–30 nano and micro-influencers per month for under $200 in product cost."
  ),
  spacer(80),
  body("Target influencer categories on TikTok + Instagram:", { bold: true }),
  bullet("Sticker collectors / stationery accounts — hyper-engaged audiences that already buy stickers"),
  bullet("Small business owners — they need custom stickers for packaging and branding"),
  bullet("Van life / travel creators — water bottle decal culture"),
  bullet("Band / music accounts — band merch stickers are a real product category"),
  bullet("Craft / DIY creators — they incorporate stickers into their projects"),
  spacer(80),
  body("The DM template that works:", { bold: true }),
  body(
    '"Hey [name] — we make custom stickers and think you\'d love what we do. Would you be open to trying a free pack? No strings attached, just share if you love them."',
    { color: BRAND_DARK, size: 21 }
  ),
  spacer(80),
  body("Tracking: Give each influencer a unique discount code (e.g., SARAH10, TYLER15) to track conversions per creator.", { bold: true }),
  spacer(120),

  subSubHead("Phase 2 Budget Breakdown"),
  spacer(80),
  dataTable(
    ["Channel", "Monthly Budget", "Goal"],
    [
      ["Google (remarketing + shopping + search)", "$300", "Purchase-intent + retargeting"],
      ["Meta / Instagram", "$250", "Retargeting + lookalike audiences"],
      ["TikTok Spark Ads", "$150", "Amplify organic wins"],
      ["Pinterest Shopping", "$125", "Visual discovery"],
      ["Influencer gifting (product cost)", "$175", "UGC + organic reach"],
      ["TOTAL", "~$1,000/month", "50–100 orders/month"],
    ]
  ),

  pgBreak(),

  // ── PHASE 3 ───────────────────────────────────────────────────────────────
  subHead("Phase 3 — Scale What Works (Month 4+)"),
  body(
    "Budget: $2,000–$5,000/month",
    { bold: true, color: ACCENT_GREEN, size: 24 }
  ),
  body(
    "By now you have real data: which platforms drive orders, which creatives performed, which sticker types have the lowest cost per acquisition. Scale ONLY the channels that proved themselves in Phase 2. Kill the rest."
  ),
  spacer(100),

  subSubHead("3A. Meta Lookalike Audiences"),
  body(
    "Once you have 100+ purchasers in your Meta pixel, create a Lookalike Audience from your buyer list. Meta finds people who statistically resemble your actual customers — same demographics, interests, behaviors."
  ),
  spacer(80),
  body("Full-funnel ad structure:", { bold: true }),
  bullet("Top of funnel (cold): Instagram Reels — brand story — 'What is Sticky Banditos?'"),
  bullet("Middle of funnel (warm visitors): Feed/Carousel — product showcase — 'Die-cut, holographic, glitter options'"),
  bullet("Bottom of funnel (cart abandoners): Story/Feed — urgency — 'Your cart expires in 24 hrs. Here's 15% off.'"),
  spacer(120),

  subSubHead("3B. Google Shopping Full Catalog Feed"),
  body(
    "Set up a full Google Product Feed from your product catalog. Every product with its image, price, and title shows in Google Shopping results. This is how StickerMule dominates Google search — their products appear visually before anyone even clicks a result."
  ),
  stat("Google Shopping CPC: $0.25–$3 vs $1–$20 for standard search ads"),
  spacer(120),

  subSubHead("3C. YouTube Pre-Roll Ads ($0.10–$0.30 CPC)"),
  body(
    "By Phase 3, repurpose your best organic TikTok videos for YouTube Pre-Roll ads. 15–30 second 'how it's made' process video with 'Try it yourself' CTA. Link to a specific product landing page. YouTube CPC is $0.10–$0.30 — among the cheapest discovery traffic outside of TikTok."
  ),
  spacer(120),

  subSubHead("3D. Email Marketing as a Retention Engine"),
  body(
    "Every order is an email address. Email has the highest ROI of any marketing channel (~$36–42 per dollar spent). Build these sequences in Resend (already integrated):"
  ),
  spacer(80),
  bullet("Post-purchase T+1 day: 'Your stickers are being made.' Process update, sets expectation."),
  bullet("Shipped T+0: Tracking link + 'Tag us when they arrive @stickybanditos' — encourages UGC."),
  bullet("Delivered T+7: Review request with direct star-rating link."),
  bullet("Re-engage T+30 (no second order): 'It's been a month — need a restock?' + 10% off second order."),
  bullet("Win-back T+60 (no order): 'We miss you. Here's $5 off anything.'"),

  pgBreak(),

  // ── AD CREATIVE FORMULA ───────────────────────────────────────────────────
  sectionHead("The Ad Creative Formula for Stickers"),
  body(
    "This applies across TikTok, Instagram Reels, and Facebook — the three highest-volume social platforms for your audience."
  ),
  spacer(80),

  subSubHead("The Hook (First 2 Seconds — Everything Depends On This)"),
  bullet("Satisfying process footage: peel, die-cut punch, glossy finish reveal"),
  bullet("Bold text: '50 custom stickers for $X — here's what they look like'"),
  bullet("Pattern interrupt: 'POV: you order stickers online and they actually look like your design'"),
  spacer(80),

  subSubHead("The Body (3–10 Seconds)"),
  bullet("Show the product from multiple angles"),
  bullet("Zoom in on quality details: edge cuts on die-cut, holographic shimmer, vinyl texture"),
  bullet("Real person reaction — 'These are INSANE quality'"),
  spacer(80),

  subSubHead("The CTA"),
  bullet("'Link in bio | 50 stickers from $X'"),
  bullet("'Use code TIKTOK10 for 10% off'"),
  bullet("Urgency where real: 'This week's deal ends Sunday'"),
  spacer(80),
  body(
    "Biggest creative mistake to avoid: Over-produced studio content. Real phone footage + authentic copy wins on TikTok, Instagram Reels, and even Facebook feed. Viewers are trained to skip polished 'ad-looking' ads.",
    { bold: true, color: BRAND_RED }
  ),

  pgBreak(),

  // ══════════════════════════════════════════════════════════════════════════
  //  PART 3 — SAMPLE PACK
  // ══════════════════════════════════════════════════════════════════════════
  sectionHead("Part 3: The $2 Sample Pack Acquisition Strategy"),
  body(
    "StickerMule's sample is their #3 most ordered product at 1.5 million total sample orders. StickerApp uses a $2 physical sample pack as their primary acquisition tool. Here's why it works:"
  ),
  spacer(80),
  stat("Prospect pays $2, gets real stickers in hand — $2 covers shipping, near-zero CAC"),
  stat("The sample IS the ad — once it's in their hands, no ad can compete"),
  stat("80%+ of customers who get a sample and love it will place a full order"),
  spacer(80),
  body("What to offer:", { bold: true }),
  body(
    "'$2 sample pack' — 5 small stickers (die-cut, holographic, vinyl) plus an insert with current deals and a QR code to order. Feature 'Sample Pack' in your main navigation."
  ),
  spacer(80),
  body(
    "Promote this in all Phase 2 paid ads as a low-friction entry point. Getting someone to spend $2 is infinitely easier than getting them to spend $50 cold. The goal is to get the product in their hands.",
    { bold: true }
  ),

  pgBreak(),

  // ══════════════════════════════════════════════════════════════════════════
  //  PART 4 — SEO
  // ══════════════════════════════════════════════════════════════════════════
  sectionHead("Part 4: SEO & Content Engine"),
  body(
    "StickerApp publishes 2–3 blog posts per week across two categories that build long-term organic traffic. This takes time but pays indefinitely — unlike paid ads."
  ),
  spacer(80),
  subSubHead("Category 1: Sticker Academy (How-To Content)"),
  bullet("'How to design a die-cut sticker that actually die-cuts well'"),
  bullet("'Best vinyl materials for outdoor stickers'"),
  bullet("'How to apply a sticker to a water bottle without bubbles'"),
  bullet("'The difference between holographic, foil, and glitter stickers explained'"),
  spacer(80),
  subSubHead("Category 2: Use-Case Landing Pages (SEO Traffic)"),
  body("Each use-case page targets a specific search term and has 800+ words + product photos + a direct 'Start Designing' CTA:"),
  bullet("Custom stickers for small businesses (packaging, branding)"),
  bullet("Custom stickers for bands and musicians"),
  bullet("Custom stickers for water bottles"),
  bullet("Holographic stickers for products"),
  bullet("Custom stickers for Etsy sellers"),
  bullet("Die-cut stickers for artists and illustrators"),
  spacer(80),
  tipBox("Each use-case page also doubles as a landing page for your niche Google Search campaigns. One piece of content does two jobs."),

  pgBreak(),

  // ══════════════════════════════════════════════════════════════════════════
  //  PART 5 — SUBSCRIPTION BOX
  // ══════════════════════════════════════════════════════════════════════════
  sectionHead("Part 5: Subscription Box — Monthly Recurring Revenue"),
  body("The Sticker Savages proof of concept:", { bold: true }),
  stat("76+ consecutive months of subscription box"),
  stat("$10/month — 10 stickers per box — artist-submitted designs"),
  stat("76,600 Instagram followers built entirely around subscription community"),
  spacer(80),
  body("Why this is powerful for Sticky Banditos:", { bold: true }),
  bullet("Predictable monthly revenue you can plan around"),
  bullet("Community building — subscribers share unboxings"),
  bullet("Artist partnership pipeline — each featured artist promotes the box to their audience"),
  bullet("Instagram growth machine — every unboxing is a potential post"),
  spacer(80),
  body("How to launch:", { bold: true }),
  bullet("Recruit 5 artists via Instagram DM: 'We're starting a monthly sticker subscription. Want your design featured? You get full credit + we promote your work.'"),
  bullet("Price at $12/month (slightly over Sticker Savages to signal premium quality)"),
  bullet("Limit initial boxes to 100 subscribers to control fulfillment"),
  bullet("Include an 'Artist Feature' insert with each box — who made the design, their IG handle, their story in 2 sentences"),
  bullet("Run a TikTok/Instagram 'Monthly Reveal' video for each box"),

  pgBreak(),

  // ══════════════════════════════════════════════════════════════════════════
  //  PART 6 — B2B
  // ══════════════════════════════════════════════════════════════════════════
  sectionHead("Part 6: B2B Endorsement Program"),
  body(
    "StickerApp prominently features brand clients like Porsche, GFuel, Torani, and Bedrock Sandals. Each brand showcase is an SEO asset, a social proof signal, and a referral source."
  ),
  spacer(80),
  body("Local businesses to target first:", { bold: true }),
  bullet("Coffee shops (cup stickers, window decals)"),
  bullet("Breweries (bottle labels)"),
  bullet("Gyms (equipment stickers, merch)"),
  bullet("Barbers and salons (window stickers)"),
  bullet("Food trucks (container labels, signage)"),
  spacer(80),
  body("The pitch:", { bold: true }),
  body(
    "Offer first order free in exchange for letting you photograph the stickers in-use and feature them on your site. This gives you real photos of stickers in real environments (better than stock mockups) and business owners who now recommend you to their networks."
  ),

  pgBreak(),

  // ══════════════════════════════════════════════════════════════════════════
  //  PART 7 — DEALS
  // ══════════════════════════════════════════════════════════════════════════
  sectionHead("Part 7: Deals as Customer Acquisition"),
  body(
    "StickerMule's Deals page is a primary navigation tab. $29 for 50 holographic stickers (normally $80). They use it to generate urgency, capture emails, and drive first-time orders."
  ),
  body(
    "Sticky Banditos already has a deals system built. Make it a primary acquisition funnel."
  ),
  spacer(80),
  body("Deal structure that works:", { bold: true }),
  bullet("One specific product at a time"),
  bullet("Specific, low price for a specific quantity"),
  bullet("'3 days left' urgency timer"),
  bullet("Inline reviews on the deal page"),
  bullet("Prominent savings callout: 'Normally $X, today $Y'"),
  spacer(80),
  body("Promotion cadence:", { bold: true }),
  bullet("Run a new deal every 2–3 weeks"),
  bullet("Feature it in Instagram/TikTok posts: 'This week's deal — 50 stickers for $29'"),
  bullet("Email your list every deal launch"),
  bullet("Top homepage banner for full deal duration"),
  bullet("Create a Pinterest pin per deal (these can drive traffic for months)"),

  pgBreak(),

  // ══════════════════════════════════════════════════════════════════════════
  //  BUDGET OVERVIEW
  // ══════════════════════════════════════════════════════════════════════════
  sectionHead("Overall Budget Overview by Phase"),
  spacer(80),
  dataTable(
    ["Phase", "Timeline", "Monthly Ad Spend", "Key Goal"],
    [
      ["Phase 1", "Weeks 1–6", "$300–$400", "First 20 orders. Pixel data. Reviews."],
      ["Phase 2", "Months 2–3", "$800–$1,000", "50–100 orders/month. TikTok organic. Influencers."],
      ["Phase 3", "Months 4+", "$2,000–$5,000", "Scale proven channels. Lookalike audiences."],
    ]
  ),
  spacer(200),
  body(
    "The most important rule: Don't pour money into Phase 2 until Phase 1 delivers real data. Don't pour money into Phase 3 until Phase 2 proves which channels convert. Patience with budget. Aggression with creative testing.",
    { bold: true, color: BRAND_RED }
  ),

  pgBreak(),

  // ══════════════════════════════════════════════════════════════════════════
  //  30-DAY LAUNCH CHECKLIST
  // ══════════════════════════════════════════════════════════════════════════
  sectionHead("30-Day Launch Checklist"),

  subSubHead("Week 1 — Install Everything"),
  checkItem("Install Meta Pixel in next-app/app/layout.tsx"),
  checkItem("Install Google Analytics 4 + Ads conversion tag"),
  checkItem("Install TikTok Pixel"),
  checkItem("Install Pinterest Tag"),
  checkItem("Verify all pixels fire on product page, add-to-cart, and checkout confirmation"),
  spacer(120),

  subSubHead("Week 2 — Build The Retention Foundation"),
  checkItem("Build 3-email abandoned cart recovery sequence (Resend — already integrated)"),
  checkItem("Build post-purchase email sequence (T+1 shipped, T+7 review request)"),
  checkItem("Add 'Write a review' link to order confirmation email"),
  checkItem("Create Google Business Profile (required for Google Seller Ratings in ads)"),
  spacer(120),

  subSubHead("Week 3 — Launch Phase 1 Ads"),
  checkItem("Create Google Ads account"),
  checkItem("Launch Google Remarketing campaign — $10/day"),
  checkItem("Launch Performance Max campaign — $5/day"),
  checkItem("Create Meta Business account + launch retargeting campaign — $8/day"),
  checkItem("Launch one niche Google Search campaign for top product — $5/day"),
  spacer(120),

  subSubHead("Week 4 — Content & Influencer"),
  checkItem("Film 3 TikTok/Instagram process videos (iPhone only, no studio needed)"),
  checkItem("Create Pinterest Business account and upload product catalog"),
  checkItem("Launch Pinterest Shopping Ads — $5/day"),
  checkItem("Identify 10 micro-influencers to send sample packs to (search relevant hashtags)"),
  checkItem("Send first batch of influencer DMs"),
  spacer(120),

  subSubHead("Weekly Ongoing Tasks"),
  checkItem("Review ad performance every Monday: CPC, CTR, CPA, ROAS"),
  checkItem("Kill any creative with CTR < 0.5% after 2,000 impressions"),
  checkItem("Post 3x/week on TikTok and Instagram"),
  checkItem("Respond to every review within 24 hours"),
  checkItem("Refresh ad creative every 3–4 weeks to combat ad fatigue"),

  pgBreak(),

  // ══════════════════════════════════════════════════════════════════════════
  //  MEASUREMENT
  // ══════════════════════════════════════════════════════════════════════════
  sectionHead("What to Measure — KPIs & Targets"),
  spacer(80),
  dataTable(
    ["Metric", "Target", "When to Worry"],
    [
      ["ROAS (Meta/Instagram)", "2x minimum (month 2), 3x+ (month 4)", "Under 1.5x after 60 days"],
      ["ROAS (Google Shopping)", "4–6x", "Under 2x after 60 days"],
      ["ROAS (TikTok)", "1.5–2x (awareness platform)", "Under 1x any month"],
      ["Pinterest CPA", "Under $10 for retail ecommerce", "Over $15 sustained"],
      ["Cart abandonment recovery", "3–5% of abandoned carts", "Under 1%"],
      ["Product page → Add to cart", "5%+", "Under 2%"],
      ["Add to cart → Checkout", "50%+", "Under 30%"],
      ["Checkout → Purchase", "70%+", "Under 50%"],
    ]
  ),
  spacer(200),
  body(
    "If checkout → purchase conversion is low, fix the checkout experience before scaling ad spend. If add-to-cart is low, fix the product page. Ads bring visitors — the site converts them.",
    { bold: true }
  ),

  pgBreak(),

  // ══════════════════════════════════════════════════════════════════════════
  //  COMPETITIVE ADVANTAGE
  // ══════════════════════════════════════════════════════════════════════════
  sectionHead("Your Competitive Advantages — Lean Into These In All Ads"),
  spacer(80),
  subSubHead("1. Built-In Design Editor"),
  body(
    "StickerMule requires separate design software. Sticky Banditos lets you design stickers right on the website. This is a genuine product advantage over the market leader. Promote it explicitly: 'Design your stickers right here — no third-party tools required.'"
  ),
  spacer(80),
  subSubHead("2. Premium Material Options"),
  body(
    "Vinyl, holographic, foil, embossed finishes. Most budget competitors only do standard vinyl. Market the premium options aggressively — especially holographic, which is a high-ASP, visually compelling product that photographs and films beautifully."
  ),
  spacer(80),
  subSubHead("3. Human Brand"),
  body(
    "StickerMule is a corporation. You can be personal. Show faces. Show the process. Show the actual person making the stickers. This wins with the DTC-minded buyer who values story and authenticity over faceless efficiency. This is not a weakness against a big competitor — it's your differentiator."
  ),
  spacer(80),
  subSubHead("4. Speed + Transparency"),
  body(
    "If you can match or beat StickerMule's turnaround, make turnaround time a prominent feature everywhere: 'Ships in X days. Actually.' Real turnaround transparency is a conversion driver in a category where customers have been burned before."
  ),

  pgBreak(),

  // ─── Footer / Sources ─────────────────────────────────────────────────────
  spacer(300),
  new Paragraph({
    border: { top: { color: "CCCCCC", size: 6, style: BorderStyle.SINGLE } },
    spacing: { before: 100, after: 60 },
    children: [
      new TextRun({
        text: "All statistics sourced from: StickerMule public stats page, StickerApp live research, Sticker Savages, Shopify Marketing Blog (Google Ads, Facebook Ads, TikTok Ads, Pinterest Ads, Instagram Ads, Influencer Marketing guides), InfluencerMarketingHub 2024 Benchmark Report, Birdeye Consumer Review Survey, Klaviyo Ecommerce Benchmarks. Compiled March 2026.",
        color: "999999",
        size: 16,
        font: "Calibri",
        italics: true,
      }),
    ],
  }),
];

// ─── Build & write ────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22, color: BODY_GREY },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.2),
            right: convertInchesToTwip(1.2),
          },
        },
      },
      children,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(OUTPUT_PATH, buffer);
console.log(`✅  Created: ${OUTPUT_PATH}`);
