import { db } from "./db";
import { categories, products, productOptions, pricingTiers } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Create categories
  const [stickersCategory] = await db
    .insert(categories)
    .values({
      name: "Stickers",
      slug: "stickers",
      description: "Custom stickers in all shapes and sizes",
      displayOrder: 1,
    })
    .onConflictDoNothing()
    .returning();

  const [cardsCategory] = await db
    .insert(categories)
    .values({
      name: "Business Cards",
      slug: "business-cards",
      description: "Professional business cards",
      displayOrder: 2,
    })
    .onConflictDoNothing()
    .returning();

  const [flyersCategory] = await db
    .insert(categories)
    .values({
      name: "Flyers & Posters",
      slug: "flyers-posters",
      description: "Marketing materials and posters",
      displayOrder: 3,
    })
    .onConflictDoNothing()
    .returning();

  console.log("Categories created");

  // Create products
  const [customStickers] = await db
    .insert(products)
    .values({
      categoryId: stickersCategory?.id || 1,
      name: "Custom Die-Cut Stickers",
      slug: "custom-die-cut-stickers",
      description: "High-quality vinyl stickers cut to any shape. Perfect for branding, laptops, water bottles, and more.",
      basePrice: "4.99",
      minQuantity: 50,
      isFeatured: true,
      templateWidth: 400,
      templateHeight: 400,
    })
    .onConflictDoNothing()
    .returning();

  const [kissStickers] = await db
    .insert(products)
    .values({
      categoryId: stickersCategory?.id || 1,
      name: "Kiss-Cut Stickers",
      slug: "kiss-cut-stickers",
      description: "Stickers cut on sheets, easy to peel and apply. Great for giveaways and packaging.",
      basePrice: "3.99",
      minQuantity: 100,
      isFeatured: true,
      templateWidth: 400,
      templateHeight: 400,
    })
    .onConflictDoNothing()
    .returning();

  const [businessCards] = await db
    .insert(products)
    .values({
      categoryId: cardsCategory?.id || 2,
      name: "Standard Business Cards",
      slug: "standard-business-cards",
      description: "Professional 3.5 x 2 inch business cards on premium cardstock.",
      basePrice: "19.99",
      minQuantity: 100,
      isFeatured: true,
      templateWidth: 350,
      templateHeight: 200,
    })
    .onConflictDoNothing()
    .returning();

  const [flyers] = await db
    .insert(products)
    .values({
      categoryId: flyersCategory?.id || 3,
      name: "Marketing Flyers",
      slug: "marketing-flyers",
      description: "Full-color flyers perfect for promotions, events, and marketing campaigns.",
      basePrice: "9.99",
      minQuantity: 50,
      isFeatured: true,
      templateWidth: 850,
      templateHeight: 1100,
    })
    .onConflictDoNothing()
    .returning();

  console.log("Products created");

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
