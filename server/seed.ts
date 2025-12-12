import { db } from "./db";
import { categories, products, productOptions, pricingTiers, deals } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Create categories - ONLY stickers, labels, and bottle labels
  await db.insert(categories).values([
    { name: "Stickers", slug: "stickers", description: "Custom stickers in all shapes, sizes, and materials", displayOrder: 1 },
    { name: "Labels", slug: "labels", description: "Professional product and packaging labels", displayOrder: 2 },
    { name: "Bottle Labels", slug: "bottle-labels", description: "Custom wrap-style labels for bottles and containers", displayOrder: 3 },
  ]).onConflictDoNothing();

  console.log("Categories created");

  // Get category IDs
  const cats = await db.select().from(categories);
  const stickersId = cats.find(c => c.slug === "stickers")?.id || 1;
  const labelsId = cats.find(c => c.slug === "labels")?.id || 2;
  const bottleLabelsId = cats.find(c => c.slug === "bottle-labels")?.id || 3;

  // Create all products
  const productData = [
    // ============ STICKERS ============
    
    // Die-Cut Stickers by Size
    { name: "Custom Die-Cut Stickers", slug: "custom-die-cut-stickers", description: "High-quality vinyl stickers cut to any custom shape. Perfect for branding, laptops, water bottles, and more. Weather-resistant and durable.", categoryId: stickersId, basePrice: "0.29", minQuantity: 50, isFeatured: true, templateWidth: 300, templateHeight: 300, bleedSize: "0.125" },
    { name: "1\" Die-Cut Stickers", slug: "die-cut-stickers-1", description: "Compact 1 inch die-cut vinyl stickers. Perfect for small labels, seals, and decorations.", categoryId: stickersId, basePrice: "0.15", minQuantity: 100, isFeatured: false, templateWidth: 100, templateHeight: 100, bleedSize: "0.125" },
    { name: "2\" Die-Cut Stickers", slug: "die-cut-stickers-2", description: "Popular 2 inch die-cut vinyl stickers. Great for logos, branding, and giveaways.", categoryId: stickersId, basePrice: "0.25", minQuantity: 50, isFeatured: true, templateWidth: 200, templateHeight: 200, bleedSize: "0.125" },
    { name: "3\" Die-Cut Stickers", slug: "die-cut-stickers-3", description: "Standard 3 inch die-cut vinyl stickers. Our most popular size for bumper stickers and branding!", categoryId: stickersId, basePrice: "0.29", minQuantity: 50, isFeatured: true, templateWidth: 300, templateHeight: 300, bleedSize: "0.125" },
    { name: "4\" Die-Cut Stickers", slug: "die-cut-stickers-4", description: "Large 4 inch die-cut vinyl stickers. Great for bumper stickers, signage, and maximum visibility.", categoryId: stickersId, basePrice: "0.40", minQuantity: 25, isFeatured: false, templateWidth: 400, templateHeight: 400, bleedSize: "0.125" },
    
    // Circle Stickers
    { name: "Circle Stickers", slug: "circle-stickers", description: "Round vinyl stickers perfect for logos, seals, and labels. Full-color printing with gloss or matte finish.", categoryId: stickersId, basePrice: "0.22", minQuantity: 50, isFeatured: true, templateWidth: 200, templateHeight: 200, bleedSize: "0.125" },
    { name: "1\" Circle Stickers", slug: "circle-stickers-1", description: "Small 1 inch round stickers. Perfect for seals, thank-you stickers, and small branding.", categoryId: stickersId, basePrice: "0.15", minQuantity: 100, isFeatured: false, templateWidth: 100, templateHeight: 100, bleedSize: "0.125" },
    { name: "2\" Circle Stickers", slug: "circle-stickers-2", description: "2 inch round vinyl stickers. Popular for logos and product labels.", categoryId: stickersId, basePrice: "0.22", minQuantity: 50, isFeatured: true, templateWidth: 200, templateHeight: 200, bleedSize: "0.125" },
    { name: "3\" Circle Stickers", slug: "circle-stickers-3", description: "3 inch round vinyl stickers. Great size for bumper stickers and branding.", categoryId: stickersId, basePrice: "0.30", minQuantity: 50, isFeatured: false, templateWidth: 300, templateHeight: 300, bleedSize: "0.125" },
    { name: "4\" Circle Stickers", slug: "circle-stickers-4", description: "Large 4 inch round vinyl stickers. Maximum visibility for your brand.", categoryId: stickersId, basePrice: "0.45", minQuantity: 25, isFeatured: false, templateWidth: 400, templateHeight: 400, bleedSize: "0.125" },
    
    // Square & Rectangle Stickers
    { name: "Square & Rectangle Stickers", slug: "square-rectangle-stickers", description: "Versatile square and rectangle stickers for product labels, packaging, and branding.", categoryId: stickersId, basePrice: "0.24", minQuantity: 50, isFeatured: true, templateWidth: 300, templateHeight: 200, bleedSize: "0.125" },
    { name: "2\" x 1\" Rectangle Stickers", slug: "rectangle-stickers-2x1", description: "Compact 2x1 inch rectangle stickers. Perfect for address labels and product tags.", categoryId: stickersId, basePrice: "0.18", minQuantity: 100, isFeatured: false, templateWidth: 200, templateHeight: 100, bleedSize: "0.125" },
    { name: "3\" x 2\" Rectangle Stickers", slug: "rectangle-stickers-3x2", description: "Versatile 3x2 inch rectangle stickers for branding and packaging.", categoryId: stickersId, basePrice: "0.24", minQuantity: 50, isFeatured: true, templateWidth: 300, templateHeight: 200, bleedSize: "0.125" },
    { name: "4\" x 2\" Rectangle Stickers", slug: "rectangle-stickers-4x2", description: "Wide 4x2 inch rectangle stickers. Great for bumper stickers and promotional use.", categoryId: stickersId, basePrice: "0.30", minQuantity: 50, isFeatured: false, templateWidth: 400, templateHeight: 200, bleedSize: "0.125" },
    
    // Oval Stickers
    { name: "Oval Stickers", slug: "oval-stickers", description: "Elegant oval stickers for vintage-style labels and premium branding.", categoryId: stickersId, basePrice: "0.24", minQuantity: 50, isFeatured: false, templateWidth: 300, templateHeight: 200, bleedSize: "0.125" },
    { name: "2\" x 1\" Oval Stickers", slug: "oval-stickers-2x1", description: "Classic 2x1 inch oval stickers. Great for vintage-style labels.", categoryId: stickersId, basePrice: "0.20", minQuantity: 100, isFeatured: false, templateWidth: 200, templateHeight: 100, bleedSize: "0.125" },
    { name: "3\" x 2\" Oval Stickers", slug: "oval-stickers-3x2", description: "Medium 3x2 inch oval stickers. Elegant shape for premium labels.", categoryId: stickersId, basePrice: "0.28", minQuantity: 50, isFeatured: false, templateWidth: 300, templateHeight: 200, bleedSize: "0.125" },
    
    // Kiss-Cut & Sticker Sheets
    { name: "Kiss-Cut Sticker Sheets", slug: "kiss-cut-sheets", description: "Multiple stickers on a single sheet, kiss-cut for easy peeling. Perfect for variety packs and giveaways.", categoryId: stickersId, basePrice: "2.00", minQuantity: 25, isFeatured: true, templateWidth: 500, templateHeight: 700, bleedSize: "0.125" },
    { name: "Full Sticker Sheets (8.5\" x 11\")", slug: "sticker-sheets-full", description: "Full letter-size sticker sheets. Maximum stickers per sheet for retail and merchandise.", categoryId: stickersId, basePrice: "3.50", minQuantity: 25, isFeatured: true, templateWidth: 550, templateHeight: 700, bleedSize: "0.125" },
    
    // Special Materials
    { name: "Holographic Stickers", slug: "holographic-stickers", description: "Eye-catching holographic vinyl stickers with rainbow shimmer effect. Stand out from the crowd!", categoryId: stickersId, basePrice: "0.55", minQuantity: 50, isFeatured: true, templateWidth: 300, templateHeight: 300, bleedSize: "0.125" },
    { name: "Clear Vinyl Stickers", slug: "clear-vinyl-stickers", description: "Transparent vinyl stickers for a seamless look on any surface. Perfect for windows and glass.", categoryId: stickersId, basePrice: "0.35", minQuantity: 50, isFeatured: true, templateWidth: 300, templateHeight: 300, bleedSize: "0.125" },
    
    // Custom Shape
    { name: "Custom Shape Stickers", slug: "custom-shape-stickers", description: "Upload your design and we auto-trace the shape. Unique contour-cut stickers for any design.", categoryId: stickersId, basePrice: "0.35", minQuantity: 50, isFeatured: false, templateWidth: 300, templateHeight: 300, bleedSize: "0.125" },
    
    // ============ LABELS ============
    
    { name: "Roll Labels", slug: "roll-labels", description: "Labels on rolls for easy dispensing. Perfect for high-volume product labeling. Available in round and rectangle shapes.", categoryId: labelsId, basePrice: "0.08", minQuantity: 250, isFeatured: true, templateWidth: 200, templateHeight: 200, bleedSize: "0.125" },
    { name: "1\" x 1\" Roll Labels", slug: "roll-labels-1x1", description: "Compact 1x1 inch roll labels. Great for small products and seals.", categoryId: labelsId, basePrice: "0.05", minQuantity: 500, isFeatured: false, templateWidth: 100, templateHeight: 100, bleedSize: "0.125" },
    { name: "2\" x 2\" Roll Labels", slug: "roll-labels-2x2", description: "Popular 2x2 inch roll labels for product branding.", categoryId: labelsId, basePrice: "0.08", minQuantity: 250, isFeatured: true, templateWidth: 200, templateHeight: 200, bleedSize: "0.125" },
    { name: "3\" x 2\" Roll Labels", slug: "roll-labels-3x2", description: "Rectangular 3x2 inch roll labels. Versatile for many products.", categoryId: labelsId, basePrice: "0.10", minQuantity: 250, isFeatured: false, templateWidth: 300, templateHeight: 200, bleedSize: "0.125" },
    { name: "Product Labels", slug: "product-labels", description: "Professional product labels in various sizes. Durable and waterproof for any application.", categoryId: labelsId, basePrice: "0.12", minQuantity: 100, isFeatured: true, templateWidth: 300, templateHeight: 200, bleedSize: "0.125" },
    { name: "Packaging Labels", slug: "packaging-labels", description: "Rectangle labels perfect for packaging, boxes, and shipping. Professional appearance guaranteed.", categoryId: labelsId, basePrice: "0.15", minQuantity: 100, isFeatured: false, templateWidth: 400, templateHeight: 200, bleedSize: "0.125" },
    
    // ============ BOTTLE LABELS ============
    
    { name: "Bottle Labels", slug: "bottle-labels", description: "Custom wrap-style labels designed for bottles and containers. Waterproof and durable for food, beverage, and cosmetic products.", categoryId: bottleLabelsId, basePrice: "0.25", minQuantity: 100, isFeatured: true, templateWidth: 600, templateHeight: 200, bleedSize: "0.125" },
    { name: "Wine Bottle Labels", slug: "wine-bottle-labels", description: "Premium labels sized for standard wine bottles. Elegant and professional for wineries and events.", categoryId: bottleLabelsId, basePrice: "0.35", minQuantity: 50, isFeatured: true, templateWidth: 500, templateHeight: 300, bleedSize: "0.125" },
    { name: "Beer Bottle Labels", slug: "beer-bottle-labels", description: "Labels designed for standard beer bottles. Waterproof and fade-resistant.", categoryId: bottleLabelsId, basePrice: "0.30", minQuantity: 100, isFeatured: false, templateWidth: 400, templateHeight: 250, bleedSize: "0.125" },
    { name: "Candle Labels", slug: "candle-labels", description: "Heat-resistant labels for candle jars and containers. Safe for high temperatures.", categoryId: bottleLabelsId, basePrice: "0.28", minQuantity: 100, isFeatured: true, templateWidth: 450, templateHeight: 200, bleedSize: "0.125" },
    { name: "Cosmetic Bottle Labels", slug: "cosmetic-bottle-labels", description: "Water-resistant labels for lotions, soaps, and beauty products. Professional finish.", categoryId: bottleLabelsId, basePrice: "0.22", minQuantity: 100, isFeatured: false, templateWidth: 400, templateHeight: 180, bleedSize: "0.125" },
    { name: "Food Jar Labels", slug: "food-jar-labels", description: "FDA-compliant labels for food jars, honey, jams, and sauces. Dishwasher safe.", categoryId: bottleLabelsId, basePrice: "0.20", minQuantity: 100, isFeatured: false, templateWidth: 500, templateHeight: 200, bleedSize: "0.125" },
  ];

  console.log("Creating products...");
  for (const prod of productData) {
    await db.insert(products).values(prod).onConflictDoNothing();
  }

  console.log("Products created");

  // Get product IDs for options and pricing
  const allProducts = await db.select().from(products);
  const customStickers = allProducts.find(p => p.slug === "custom-die-cut-stickers");
  const holoStickers = allProducts.find(p => p.slug === "holographic-stickers");
  const rollLabels = allProducts.find(p => p.slug === "roll-labels");
  const bottleLabels = allProducts.find(p => p.slug === "bottle-labels");

  // Add product options for custom die-cut stickers
  if (customStickers) {
    await db.insert(productOptions).values([
      { productId: customStickers.id, optionType: "size" as const, name: '2"', value: "2", isDefault: true, displayOrder: 1 },
      { productId: customStickers.id, optionType: "size" as const, name: '3"', value: "3", priceModifier: "0.10", displayOrder: 2 },
      { productId: customStickers.id, optionType: "size" as const, name: '4"', value: "4", priceModifier: "0.20", displayOrder: 3 },
      { productId: customStickers.id, optionType: "material" as const, name: "White Vinyl", value: "white-vinyl", isDefault: true, displayOrder: 1 },
      { productId: customStickers.id, optionType: "material" as const, name: "Clear Vinyl", value: "clear-vinyl", priceModifier: "0.15", displayOrder: 2 },
      { productId: customStickers.id, optionType: "material" as const, name: "Holographic", value: "holographic", priceModifier: "0.35", displayOrder: 3 },
      { productId: customStickers.id, optionType: "coating" as const, name: "Matte", value: "matte", isDefault: true, displayOrder: 1 },
      { productId: customStickers.id, optionType: "coating" as const, name: "Glossy", value: "glossy", displayOrder: 2 },
    ]).onConflictDoNothing();

    await db.insert(pricingTiers).values([
      { productId: customStickers.id, minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.29" },
      { productId: customStickers.id, minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.22" },
      { productId: customStickers.id, minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.18" },
      { productId: customStickers.id, minQuantity: 500, maxQuantity: null, pricePerUnit: "0.15" },
    ]).onConflictDoNothing();
  }

  // Add pricing tiers for holographic stickers
  if (holoStickers) {
    await db.insert(pricingTiers).values([
      { productId: holoStickers.id, minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.55" },
      { productId: holoStickers.id, minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.45" },
      { productId: holoStickers.id, minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.38" },
      { productId: holoStickers.id, minQuantity: 500, maxQuantity: null, pricePerUnit: "0.32" },
    ]).onConflictDoNothing();
  }

  // Add product options for roll labels
  if (rollLabels) {
    await db.insert(productOptions).values([
      { productId: rollLabels.id, optionType: "size" as const, name: '1" x 1"', value: "1x1", isDefault: true, displayOrder: 1 },
      { productId: rollLabels.id, optionType: "size" as const, name: '2" x 2"', value: "2x2", priceModifier: "0.03", displayOrder: 2 },
      { productId: rollLabels.id, optionType: "size" as const, name: '3" x 2"', value: "3x2", priceModifier: "0.05", displayOrder: 3 },
      { productId: rollLabels.id, optionType: "shape" as const, name: "Round", value: "round", isDefault: true, displayOrder: 1 },
      { productId: rollLabels.id, optionType: "shape" as const, name: "Rectangle", value: "rectangle", displayOrder: 2 },
      { productId: rollLabels.id, optionType: "shape" as const, name: "Oval", value: "oval", priceModifier: "0.02", displayOrder: 3 },
    ]).onConflictDoNothing();

    await db.insert(pricingTiers).values([
      { productId: rollLabels.id, minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.08" },
      { productId: rollLabels.id, minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.06" },
      { productId: rollLabels.id, minQuantity: 1000, maxQuantity: 2499, pricePerUnit: "0.05" },
      { productId: rollLabels.id, minQuantity: 2500, maxQuantity: null, pricePerUnit: "0.04" },
    ]).onConflictDoNothing();
  }

  // Add product options for bottle labels
  if (bottleLabels) {
    await db.insert(productOptions).values([
      { productId: bottleLabels.id, optionType: "material" as const, name: "White BOPP", value: "white-bopp", isDefault: true, displayOrder: 1 },
      { productId: bottleLabels.id, optionType: "material" as const, name: "Clear BOPP", value: "clear-bopp", priceModifier: "0.05", displayOrder: 2 },
      { productId: bottleLabels.id, optionType: "material" as const, name: "Metallic", value: "metallic", priceModifier: "0.12", displayOrder: 3 },
      { productId: bottleLabels.id, optionType: "coating" as const, name: "Matte Laminate", value: "matte", isDefault: true, displayOrder: 1 },
      { productId: bottleLabels.id, optionType: "coating" as const, name: "Gloss Laminate", value: "gloss", displayOrder: 2 },
    ]).onConflictDoNothing();

    await db.insert(pricingTiers).values([
      { productId: bottleLabels.id, minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.25" },
      { productId: bottleLabels.id, minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.20" },
      { productId: bottleLabels.id, minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.16" },
      { productId: bottleLabels.id, minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.12" },
    ]).onConflictDoNothing();
  }

  console.log("Product options and pricing created");

  // Create Hot Deals for homepage
  console.log("Creating deals...");
  await db.insert(deals).values([
    {
      title: "500 1x1 Custom Labels",
      description: "Get 500 premium quality 1x1 inch custom labels at an unbeatable price! Perfect for product branding, packaging, or personal projects.",
      imageUrl: "/uploads/deals/500_1x1_custom_labels.png",
      originalPrice: "65.00",
      dealPrice: "42.00",
      quantity: 500,
      productSize: "1x1",
      productType: "Labels",
      linkUrl: "/products/die-cut-stickers-1x1",
      badgeText: "HOT DEAL",
      badgeColor: "green",
      ctaText: "Shop Now",
      displayOrder: 1,
      isActive: true,
      showOnHomepage: true,
    },
    {
      title: '100 3" Stickers',
      description: "Get 100 premium quality 3 inch die-cut stickers. Perfect for branding, packaging, or giveaways!",
      imageUrl: "/uploads/deals/100_3inch_stickers.png",
      originalPrice: "55.00",
      dealPrice: "35.00",
      quantity: 100,
      productSize: "3 inch",
      productType: "Stickers",
      linkUrl: "/products/die-cut-stickers-3x3",
      badgeText: "BEST SELLER",
      badgeColor: "yellow",
      ctaText: "Shop Now",
      displayOrder: 2,
      isActive: true,
      showOnHomepage: true,
    },
    {
      title: '150 1" Stickers',
      description: "Pack of 150 high-quality 1 inch mini stickers. Great for seals, labels, and decorations!",
      imageUrl: "/uploads/deals/150_1inch_stickers.png",
      originalPrice: "40.00",
      dealPrice: "25.00",
      quantity: 150,
      productSize: "1 inch",
      productType: "Stickers",
      linkUrl: "/products/circle-stickers-1",
      badgeText: "POPULAR",
      badgeColor: "purple",
      ctaText: "Shop Now",
      displayOrder: 3,
      isActive: true,
      showOnHomepage: true,
    },
    {
      title: "300 Custom Stickers",
      description: "Bulk pack of 300 custom stickers at an amazing price. Mix and match sizes!",
      imageUrl: "/uploads/deals/300_stickers.png",
      originalPrice: "95.00",
      dealPrice: "59.00",
      quantity: 300,
      productSize: "Mixed",
      productType: "Stickers",
      linkUrl: "/products/custom-die-cut-stickers",
      badgeText: "MEGA DEAL",
      badgeColor: "red",
      ctaText: "Shop Now",
      displayOrder: 4,
      isActive: true,
      showOnHomepage: true,
    },
  ]).onConflictDoNothing();
  console.log("Deals created");

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
