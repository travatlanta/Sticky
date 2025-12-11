import { db } from "./db";
import { categories, products, productOptions, pricingTiers } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Create all categories
  await db.insert(categories).values([
    { name: "Stickers", slug: "stickers", description: "Custom stickers in all shapes and sizes", displayOrder: 1 },
    { name: "Business Cards", slug: "business-cards", description: "Professional business cards", displayOrder: 2 },
    { name: "Flyers & Posters", slug: "flyers-posters", description: "Marketing materials and posters", displayOrder: 3 },
    { name: "Flyers", slug: "flyers", description: "Professional flyers in various sizes for all your marketing needs", displayOrder: 4 },
    { name: "Postcards", slug: "postcards", description: "Eye-catching postcards for direct mail and promotions", displayOrder: 5 },
    { name: "Brochures", slug: "brochures", description: "Professional tri-fold and bi-fold brochures", displayOrder: 6 },
    { name: "Posters", slug: "posters", description: "Large format posters for events and advertising", displayOrder: 7 },
  ]).onConflictDoNothing();

  console.log("Categories created");

  // Get category IDs
  const cats = await db.select().from(categories);
  const stickersId = cats.find(c => c.slug === "stickers")?.id || 1;
  const businessCardsId = cats.find(c => c.slug === "business-cards")?.id || 2;
  const flyersPostersId = cats.find(c => c.slug === "flyers-posters")?.id || 3;
  const flyersId = cats.find(c => c.slug === "flyers")?.id || 4;
  const postcardsId = cats.find(c => c.slug === "postcards")?.id || 5;
  const brochuresId = cats.find(c => c.slug === "brochures")?.id || 6;
  const postersId = cats.find(c => c.slug === "posters")?.id || 7;

  // Create all products
  const productData = [
    // Stickers
    { name: "Custom Die-Cut Stickers", slug: "custom-die-cut-stickers", description: "High-quality vinyl stickers cut to any shape. Perfect for branding, laptops, water bottles, and more.", categoryId: stickersId, basePrice: "4.99", minQuantity: 50, isFeatured: true, templateWidth: 400, templateHeight: 400, bleedSize: "0.125" },
    { name: "Kiss-Cut Stickers", slug: "kiss-cut-stickers", description: "Stickers cut on sheets, easy to peel and apply. Great for giveaways and packaging.", categoryId: stickersId, basePrice: "3.99", minQuantity: 100, isFeatured: true, templateWidth: 400, templateHeight: 400, bleedSize: "0.125" },
    { name: "Circle Stickers", slug: "circle-stickers", description: "Round vinyl stickers perfect for logos, seals, and labels. Full-color printing with gloss or matte finish.", categoryId: stickersId, basePrice: "0.25", minQuantity: 50, isFeatured: false, templateWidth: 300, templateHeight: 300, bleedSize: "0.125" },
    { name: "Square & Rectangle Stickers", slug: "square-rectangle-stickers", description: "Versatile square and rectangle stickers for product labels, packaging, and branding.", categoryId: stickersId, basePrice: "0.25", minQuantity: 50, isFeatured: false, templateWidth: 400, templateHeight: 200, bleedSize: "0.125" },
    { name: "Sticker Sheets", slug: "sticker-sheets", description: "Custom sticker sheets with multiple designs. Perfect for giveaways, retail, and merchandise.", categoryId: stickersId, basePrice: "1.50", minQuantity: 25, isFeatured: true, templateWidth: 500, templateHeight: 700, bleedSize: "0.125" },
    { name: "1\" x 1\" Die-Cut Stickers", slug: "die-cut-stickers-1x1", description: "Compact 1x1 inch die-cut vinyl stickers. Perfect for small labels and decorations.", categoryId: stickersId, basePrice: "0.20", minQuantity: 50, isFeatured: false, templateWidth: 100, templateHeight: 100, bleedSize: "0.125" },
    { name: "2\" x 2\" Die-Cut Stickers", slug: "die-cut-stickers-2x2", description: "Popular 2x2 inch die-cut vinyl stickers. Great for logos and branding.", categoryId: stickersId, basePrice: "0.25", minQuantity: 50, isFeatured: true, templateWidth: 200, templateHeight: 200, bleedSize: "0.125" },
    { name: "3\" x 3\" Die-Cut Stickers", slug: "die-cut-stickers-3x3", description: "Standard 3x3 inch die-cut vinyl stickers. Our most popular size!", categoryId: stickersId, basePrice: "0.29", minQuantity: 50, isFeatured: true, templateWidth: 300, templateHeight: 300, bleedSize: "0.125" },
    { name: "4\" x 4\" Die-Cut Stickers", slug: "die-cut-stickers-4x4", description: "Large 4x4 inch die-cut vinyl stickers. Great for bumper stickers and signage.", categoryId: stickersId, basePrice: "0.40", minQuantity: 25, isFeatured: false, templateWidth: 400, templateHeight: 400, bleedSize: "0.125" },
    { name: "5\" x 5\" Die-Cut Stickers", slug: "die-cut-stickers-5x5", description: "Extra large 5x5 inch die-cut vinyl stickers. Maximum impact for your designs.", categoryId: stickersId, basePrice: "0.55", minQuantity: 25, isFeatured: false, templateWidth: 500, templateHeight: 500, bleedSize: "0.125" },
    { name: "1\" Circle Stickers", slug: "circle-stickers-1", description: "Small 1 inch round stickers perfect for seals and labels.", categoryId: stickersId, basePrice: "0.15", minQuantity: 100, isFeatured: false, templateWidth: 100, templateHeight: 100, bleedSize: "0.125" },
    { name: "1.5\" Circle Stickers", slug: "circle-stickers-1-5", description: "1.5 inch round vinyl stickers. Great for product labels.", categoryId: stickersId, basePrice: "0.18", minQuantity: 100, isFeatured: false, templateWidth: 150, templateHeight: 150, bleedSize: "0.125" },
    { name: "2\" Circle Stickers", slug: "circle-stickers-2", description: "2 inch round vinyl stickers. Popular for logos and branding.", categoryId: stickersId, basePrice: "0.22", minQuantity: 50, isFeatured: true, templateWidth: 200, templateHeight: 200, bleedSize: "0.125" },
    { name: "2.5\" Circle Stickers", slug: "circle-stickers-2-5", description: "2.5 inch round vinyl stickers. Great balance of size and value.", categoryId: stickersId, basePrice: "0.26", minQuantity: 50, isFeatured: false, templateWidth: 250, templateHeight: 250, bleedSize: "0.125" },
    { name: "3\" Circle Stickers", slug: "circle-stickers-3", description: "3 inch round vinyl stickers. Perfect for larger logos and designs.", categoryId: stickersId, basePrice: "0.30", minQuantity: 50, isFeatured: true, templateWidth: 300, templateHeight: 300, bleedSize: "0.125" },
    { name: "4\" Circle Stickers", slug: "circle-stickers-4", description: "Large 4 inch round vinyl stickers. Maximum visibility for your brand.", categoryId: stickersId, basePrice: "0.45", minQuantity: 25, isFeatured: false, templateWidth: 400, templateHeight: 400, bleedSize: "0.125" },
    { name: "2\" x 1\" Rectangle Stickers", slug: "rectangle-stickers-2x1", description: "Compact 2x1 inch rectangle stickers. Perfect for address labels and product tags.", categoryId: stickersId, basePrice: "0.18", minQuantity: 100, isFeatured: false, templateWidth: 200, templateHeight: 100, bleedSize: "0.125" },
    { name: "3\" x 2\" Rectangle Stickers", slug: "rectangle-stickers-3x2", description: "Versatile 3x2 inch rectangle stickers for branding and packaging.", categoryId: stickersId, basePrice: "0.24", minQuantity: 50, isFeatured: true, templateWidth: 300, templateHeight: 200, bleedSize: "0.125" },
    { name: "4\" x 2\" Rectangle Stickers", slug: "rectangle-stickers-4x2", description: "Wide 4x2 inch rectangle stickers. Great for bumper stickers.", categoryId: stickersId, basePrice: "0.30", minQuantity: 50, isFeatured: false, templateWidth: 400, templateHeight: 200, bleedSize: "0.125" },
    { name: "4\" x 3\" Rectangle Stickers", slug: "rectangle-stickers-4x3", description: "Medium 4x3 inch rectangle stickers for detailed designs.", categoryId: stickersId, basePrice: "0.35", minQuantity: 50, isFeatured: false, templateWidth: 400, templateHeight: 300, bleedSize: "0.125" },
    { name: "5\" x 3\" Rectangle Stickers", slug: "rectangle-stickers-5x3", description: "Large 5x3 inch rectangle stickers. Excellent for signage.", categoryId: stickersId, basePrice: "0.42", minQuantity: 25, isFeatured: false, templateWidth: 500, templateHeight: 300, bleedSize: "0.125" },
    { name: "1.5\" x 1\" Oval Stickers", slug: "oval-stickers-1-5x1", description: "Small 1.5x1 inch oval stickers. Perfect for elegant labels.", categoryId: stickersId, basePrice: "0.16", minQuantity: 100, isFeatured: false, templateWidth: 150, templateHeight: 100, bleedSize: "0.125" },
    { name: "2\" x 1\" Oval Stickers", slug: "oval-stickers-2x1", description: "Classic 2x1 inch oval stickers. Great for vintage-style labels.", categoryId: stickersId, basePrice: "0.20", minQuantity: 100, isFeatured: false, templateWidth: 200, templateHeight: 100, bleedSize: "0.125" },
    { name: "3\" x 2\" Oval Stickers", slug: "oval-stickers-3x2", description: "Medium 3x2 inch oval stickers. Elegant shape for premium labels.", categoryId: stickersId, basePrice: "0.28", minQuantity: 50, isFeatured: false, templateWidth: 300, templateHeight: 200, bleedSize: "0.125" },
    { name: "4\" x 6\" Sticker Sheets", slug: "sticker-sheets-4x6", description: "4x6 inch sticker sheets with multiple die-cut stickers. Perfect for variety packs.", categoryId: stickersId, basePrice: "1.50", minQuantity: 25, isFeatured: false, templateWidth: 400, templateHeight: 600, bleedSize: "0.125" },
    { name: "5\" x 7\" Sticker Sheets", slug: "sticker-sheets-5x7", description: "5x7 inch sticker sheets. More space for creative sticker designs.", categoryId: stickersId, basePrice: "2.00", minQuantity: 25, isFeatured: false, templateWidth: 500, templateHeight: 700, bleedSize: "0.125" },
    { name: "8.5\" x 11\" Sticker Sheets", slug: "sticker-sheets-8-5x11", description: "Letter-size 8.5x11 inch sticker sheets. Maximum stickers per sheet.", categoryId: stickersId, basePrice: "3.50", minQuantity: 25, isFeatured: true, templateWidth: 550, templateHeight: 700, bleedSize: "0.125" },
    { name: "11\" x 17\" Sticker Sheets", slug: "sticker-sheets-11x17", description: "Tabloid-size 11x17 inch sticker sheets. Our largest sticker sheet option.", categoryId: stickersId, basePrice: "6.00", minQuantity: 10, isFeatured: false, templateWidth: 550, templateHeight: 850, bleedSize: "0.125" },
    
    // Business Cards
    { name: "Standard Business Cards", slug: "standard-business-cards", description: "Professional 3.5 x 2 inch business cards on premium cardstock.", categoryId: businessCardsId, basePrice: "19.99", minQuantity: 100, isFeatured: true, templateWidth: 350, templateHeight: 200, bleedSize: "0.125" },
    { name: "Rounded Corner Business Cards", slug: "rounded-business-cards", description: "Modern business cards with rounded corners for a softer, contemporary look.", categoryId: businessCardsId, basePrice: "0.18", minQuantity: 100, isFeatured: false, templateWidth: 350, templateHeight: 200, bleedSize: "0.125" },
    { name: "Standard Business Cards (3.5\" x 2\")", slug: "business-cards-standard", description: "Classic 3.5x2 inch business cards on premium cardstock. Full-color, double-sided.", categoryId: businessCardsId, basePrice: "0.15", minQuantity: 100, isFeatured: true, templateWidth: 350, templateHeight: 200, bleedSize: "0.125" },
    { name: "Rounded Corner Business Cards", slug: "business-cards-rounded", description: "Modern business cards with rounded corners. Contemporary look.", categoryId: businessCardsId, basePrice: "0.18", minQuantity: 100, isFeatured: false, templateWidth: 350, templateHeight: 200, bleedSize: "0.125" },
    { name: "Square Business Cards (2.5\" x 2.5\")", slug: "business-cards-square", description: "Unique square business cards. Stand out from the crowd.", categoryId: businessCardsId, basePrice: "0.20", minQuantity: 100, isFeatured: false, templateWidth: 250, templateHeight: 250, bleedSize: "0.125" },
    { name: "Mini Business Cards (3\" x 1.5\")", slug: "business-cards-mini", description: "Compact mini business cards. Perfect for networking events.", categoryId: businessCardsId, basePrice: "0.12", minQuantity: 100, isFeatured: false, templateWidth: 300, templateHeight: 150, bleedSize: "0.125" },

    // Flyers & Posters (legacy category)
    { name: "Marketing Flyers", slug: "marketing-flyers", description: "Full-color flyers perfect for promotions, events, and marketing campaigns.", categoryId: flyersPostersId, basePrice: "9.99", minQuantity: 50, isFeatured: true, templateWidth: 850, templateHeight: 1100, bleedSize: "0.125" },

    // Flyers
    { name: "8.5\" x 11\" Flyers", slug: "standard-flyers", description: "Standard US letter size flyers. Full-color, double-sided printing on premium paper.", categoryId: flyersId, basePrice: "0.64", minQuantity: 25, isFeatured: true, templateWidth: 550, templateHeight: 700, bleedSize: "0.125" },
    { name: "5.5\" x 8.5\" Half-Letter Flyers", slug: "half-letter-flyers", description: "Half-letter size flyers perfect for handouts and mailings. Full-color printing.", categoryId: flyersId, basePrice: "0.50", minQuantity: 50, isFeatured: false, templateWidth: 550, templateHeight: 425, bleedSize: "0.125" },
    { name: "Square Flyers", slug: "square-flyers", description: "Unique square flyers that stand out. Perfect for social media promotion.", categoryId: flyersId, basePrice: "0.35", minQuantity: 50, isFeatured: false, templateWidth: 500, templateHeight: 500, bleedSize: "0.125" },
    { name: "8.5\" x 11\" Flyers", slug: "flyers-8-5x11", description: "Standard US letter size flyers. Full-color, double-sided printing on premium paper.", categoryId: flyersId, basePrice: "0.65", minQuantity: 25, isFeatured: true, templateWidth: 550, templateHeight: 700, bleedSize: "0.125" },
    { name: "5.5\" x 8.5\" Half-Letter Flyers", slug: "flyers-5-5x8-5", description: "Half-letter size flyers. Perfect for handouts and mailings.", categoryId: flyersId, basePrice: "0.50", minQuantity: 50, isFeatured: false, templateWidth: 550, templateHeight: 425, bleedSize: "0.125" },
    { name: "A6 Small Flyers (4\" x 6\")", slug: "flyers-a6", description: "Compact A6 size flyers. Great for events and promotions.", categoryId: flyersId, basePrice: "0.30", minQuantity: 100, isFeatured: false, templateWidth: 400, templateHeight: 600, bleedSize: "0.125" },
    { name: "6\" x 6\" Square Flyers", slug: "flyers-square", description: "Unique square flyers that stand out. Perfect for social media promotions.", categoryId: flyersId, basePrice: "0.35", minQuantity: 50, isFeatured: false, templateWidth: 600, templateHeight: 600, bleedSize: "0.125" },
    { name: "11\" x 17\" Tabloid Flyers", slug: "flyers-11x17", description: "Large tabloid size flyers. Maximum impact for your message.", categoryId: flyersId, basePrice: "0.60", minQuantity: 25, isFeatured: true, templateWidth: 550, templateHeight: 850, bleedSize: "0.125" },

    // Postcards
    { name: "4\" x 6\" Postcards", slug: "postcards-4x6", description: "Standard postcard size. Perfect for direct mail campaigns and promotions.", categoryId: postcardsId, basePrice: "0.40", minQuantity: 50, isFeatured: true, templateWidth: 400, templateHeight: 600, bleedSize: "0.125" },
    { name: "5\" x 7\" Postcards", slug: "postcards-5x7", description: "Larger postcard format for more visual impact. Great for event invitations.", categoryId: postcardsId, basePrice: "0.50", minQuantity: 50, isFeatured: false, templateWidth: 500, templateHeight: 700, bleedSize: "0.125" },
    { name: "6\" x 9\" Jumbo Postcards", slug: "postcards-6x9", description: "Jumbo 6x9 inch postcards. Maximum impact for mailers.", categoryId: postcardsId, basePrice: "0.70", minQuantity: 50, isFeatured: false, templateWidth: 600, templateHeight: 900, bleedSize: "0.125" },

    // Brochures
    { name: "Tri-Fold Brochures", slug: "tri-fold-brochures", description: "Classic tri-fold brochures. Full-color printing on both sides with professional folding.", categoryId: brochuresId, basePrice: "0.70", minQuantity: 100, isFeatured: true, templateWidth: 700, templateHeight: 550, bleedSize: "0.125" },
    { name: "Bi-Fold Brochures", slug: "bi-fold-brochures", description: "Half-fold brochures with 4 panels. Ideal for menus, programs, and presentations.", categoryId: brochuresId, basePrice: "0.65", minQuantity: 100, isFeatured: false, templateWidth: 700, templateHeight: 550, bleedSize: "0.125" },
    { name: "Tri-Fold Brochures (8.5\" x 11\")", slug: "brochures-trifold", description: "Classic tri-fold brochures. Full-color printing on both sides.", categoryId: brochuresId, basePrice: "0.70", minQuantity: 100, isFeatured: true, templateWidth: 700, templateHeight: 550, bleedSize: "0.125" },
    { name: "Bi-Fold Brochures (8.5\" x 11\")", slug: "brochures-bifold", description: "Half-fold brochures with 4 panels. Ideal for menus and programs.", categoryId: brochuresId, basePrice: "0.65", minQuantity: 100, isFeatured: false, templateWidth: 700, templateHeight: 550, bleedSize: "0.125" },
    { name: "Z-Fold Brochures (8.5\" x 11\")", slug: "brochures-zfold", description: "Accordion-style Z-fold brochures. Unique presentation style.", categoryId: brochuresId, basePrice: "0.75", minQuantity: 100, isFeatured: false, templateWidth: 700, templateHeight: 550, bleedSize: "0.125" },

    // Posters
    { name: "11\" x 17\" Posters", slug: "posters-11x17", description: "Tabloid size posters. Great for events, promotions, and in-store displays.", categoryId: postersId, basePrice: "1.20", minQuantity: 25, isFeatured: true, templateWidth: 550, templateHeight: 850, bleedSize: "0.125" },
    { name: "18\" x 24\" Posters", slug: "posters-18x24", description: "Medium format posters for high-impact advertising and events.", categoryId: postersId, basePrice: "2.50", minQuantity: 10, isFeatured: false, templateWidth: 450, templateHeight: 600, bleedSize: "0.125" },
    { name: "24\" x 36\" Large Posters", slug: "posters-24x36", description: "Large format posters for maximum visibility. Perfect for movie posters, events, and storefronts.", categoryId: postersId, basePrice: "4.00", minQuantity: 5, isFeatured: false, templateWidth: 400, templateHeight: 600, bleedSize: "0.125" },
    { name: "36\" x 48\" Extra Large Posters", slug: "posters-36x48", description: "Extra large format posters. Maximum visibility for events.", categoryId: postersId, basePrice: "8.00", minQuantity: 5, isFeatured: false, templateWidth: 450, templateHeight: 600, bleedSize: "0.125" },
  ];

  console.log("Creating products...");
  for (const prod of productData) {
    await db.insert(products).values(prod).onConflictDoNothing();
  }

  console.log("Products created");

  // Get product IDs for options and pricing
  const allProducts = await db.select().from(products);
  const customStickers = allProducts.find(p => p.slug === "custom-die-cut-stickers");
  const businessCards = allProducts.find(p => p.slug === "standard-business-cards");

  // Add product options for stickers
  if (customStickers) {
    await db.insert(productOptions).values([
      { productId: customStickers.id, optionType: "size", name: '2" x 2"', value: "2x2", isDefault: true, displayOrder: 1 },
      { productId: customStickers.id, optionType: "size", name: '3" x 3"', value: "3x3", priceModifier: "0.50", displayOrder: 2 },
      { productId: customStickers.id, optionType: "size", name: '4" x 4"', value: "4x4", priceModifier: "1.00", displayOrder: 3 },
      { productId: customStickers.id, optionType: "material", name: "White Vinyl", value: "white-vinyl", isDefault: true, displayOrder: 1 },
      { productId: customStickers.id, optionType: "material", name: "Clear Vinyl", value: "clear-vinyl", priceModifier: "0.25", displayOrder: 2 },
      { productId: customStickers.id, optionType: "material", name: "Holographic", value: "holographic", priceModifier: "0.75", displayOrder: 3 },
      { productId: customStickers.id, optionType: "coating", name: "Matte", value: "matte", isDefault: true, displayOrder: 1 },
      { productId: customStickers.id, optionType: "coating", name: "Glossy", value: "glossy", displayOrder: 2 },
    ]).onConflictDoNothing();

    await db.insert(pricingTiers).values([
      { productId: customStickers.id, minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.50" },
      { productId: customStickers.id, minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.40" },
      { productId: customStickers.id, minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.30" },
      { productId: customStickers.id, minQuantity: 500, maxQuantity: null, pricePerUnit: "0.20" },
    ]).onConflictDoNothing();
  }

  if (businessCards) {
    await db.insert(productOptions).values([
      { productId: businessCards.id, optionType: "material", name: "Standard 14pt", value: "14pt", isDefault: true, displayOrder: 1 },
      { productId: businessCards.id, optionType: "material", name: "Premium 16pt", value: "16pt", priceModifier: "5.00", displayOrder: 2 },
      { productId: businessCards.id, optionType: "material", name: "Silk Laminated", value: "silk", priceModifier: "10.00", displayOrder: 3 },
      { productId: businessCards.id, optionType: "coating", name: "Matte", value: "matte", isDefault: true, displayOrder: 1 },
      { productId: businessCards.id, optionType: "coating", name: "Glossy UV", value: "glossy", priceModifier: "3.00", displayOrder: 2 },
      { productId: businessCards.id, optionType: "coating", name: "Spot UV", value: "spot-uv", priceModifier: "8.00", displayOrder: 3 },
    ]).onConflictDoNothing();

    await db.insert(pricingTiers).values([
      { productId: businessCards.id, minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.20" },
      { productId: businessCards.id, minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.15" },
      { productId: businessCards.id, minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.10" },
      { productId: businessCards.id, minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.07" },
    ]).onConflictDoNothing();
  }

  console.log("Product options and pricing created");
  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
