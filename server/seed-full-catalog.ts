import { db } from "./db";
import { categories, products, productOptions, pricingTiers } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedFullCatalog() {
  console.log("Starting full product catalog seed...");

  // Create categories
  const categoryData = [
    { name: "Custom Stickers", slug: "stickers", description: "High-quality vinyl stickers - die-cut, full-color, with gloss or matte finish", displayOrder: 1 },
    { name: "Flyers", slug: "flyers", description: "Professional flyers in various sizes for all your marketing needs", displayOrder: 2 },
    { name: "Business Cards", slug: "business-cards", description: "Premium business cards that make a lasting impression", displayOrder: 3 },
    { name: "Postcards", slug: "postcards", description: "Eye-catching postcards for direct mail and promotions", displayOrder: 4 },
    { name: "Brochures", slug: "brochures", description: "Professional tri-fold and bi-fold brochures", displayOrder: 5 },
    { name: "Posters", slug: "posters", description: "Large format posters for events and advertising", displayOrder: 6 },
  ];

  const insertedCategories: Record<string, number> = {};
  
  for (const cat of categoryData) {
    const existing = await db.select().from(categories).where(eq(categories.slug, cat.slug));
    if (existing.length === 0) {
      const [inserted] = await db.insert(categories).values(cat).returning();
      insertedCategories[cat.slug] = inserted.id;
      console.log(`Created category: ${cat.name}`);
    } else {
      insertedCategories[cat.slug] = existing[0].id;
      console.log(`Category exists: ${cat.name}`);
    }
  }

  // Full products data from catalog
  const productsData = [
    // ==================== STICKERS ====================
    // 1. Die-Cut 1x1
    {
      categorySlug: "stickers",
      name: '1" x 1" Die-Cut Stickers',
      slug: "die-cut-stickers-1x1",
      description: "Compact 1x1 inch die-cut vinyl stickers. Perfect for small labels and decorations.",
      basePrice: "0.20",
      minQuantity: 50,
      isFeatured: false,
      templateWidth: 100,
      templateHeight: 100,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.03" },
        { type: "coating", name: "Standard", value: "standard", priceModifier: "0", isDefault: true },
        { type: "coating", name: "UV Lamination", value: "uv", priceModifier: "0.02" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.40" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.25" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.18" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.14" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.10" },
      ],
    },
    // 2. Die-Cut 2x2
    {
      categorySlug: "stickers",
      name: '2" x 2" Die-Cut Stickers',
      slug: "die-cut-stickers-2x2",
      description: "Popular 2x2 inch die-cut vinyl stickers. Great for logos and branding.",
      basePrice: "0.25",
      minQuantity: 50,
      isFeatured: true,
      templateWidth: 200,
      templateHeight: 200,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.03" },
        { type: "material", name: "Holographic Vinyl", value: "holographic", priceModifier: "0.08" },
        { type: "coating", name: "Standard", value: "standard", priceModifier: "0", isDefault: true },
        { type: "coating", name: "UV Lamination", value: "uv", priceModifier: "0.02" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.50" },
        { minQuantity: 100, maxQuantity: 199, pricePerUnit: "0.29" },
        { minQuantity: 200, maxQuantity: 249, pricePerUnit: "0.25" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.20" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.15" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.12" },
      ],
    },
    // 3. Die-Cut 3x3
    {
      categorySlug: "stickers",
      name: '3" x 3" Die-Cut Stickers',
      slug: "die-cut-stickers-3x3",
      description: "Standard 3x3 inch die-cut vinyl stickers. Our most popular size!",
      basePrice: "0.29",
      minQuantity: 50,
      isFeatured: true,
      templateWidth: 300,
      templateHeight: 300,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.03" },
        { type: "material", name: "Holographic Vinyl", value: "holographic", priceModifier: "0.08" },
        { type: "coating", name: "Standard", value: "standard", priceModifier: "0", isDefault: true },
        { type: "coating", name: "UV Lamination", value: "uv", priceModifier: "0.02" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.60" },
        { minQuantity: 100, maxQuantity: 149, pricePerUnit: "0.35" },
        { minQuantity: 150, maxQuantity: 199, pricePerUnit: "0.30" },
        { minQuantity: 200, maxQuantity: 249, pricePerUnit: "0.27" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.20" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.16" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.12" },
      ],
    },
    // 4. Die-Cut 4x4
    {
      categorySlug: "stickers",
      name: '4" x 4" Die-Cut Stickers',
      slug: "die-cut-stickers-4x4",
      description: "Large 4x4 inch die-cut vinyl stickers. Great for bumper stickers and signage.",
      basePrice: "0.40",
      minQuantity: 25,
      isFeatured: false,
      templateWidth: 400,
      templateHeight: 400,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.05" },
        { type: "material", name: "Holographic Vinyl", value: "holographic", priceModifier: "0.10" },
      ],
      pricingTiers: [
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "0.80" },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.55" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.40" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.30" },
        { minQuantity: 500, maxQuantity: null, pricePerUnit: "0.22" },
      ],
    },
    // 5. Die-Cut 5x5
    {
      categorySlug: "stickers",
      name: '5" x 5" Die-Cut Stickers',
      slug: "die-cut-stickers-5x5",
      description: "Extra large 5x5 inch die-cut vinyl stickers. Maximum impact for your designs.",
      basePrice: "0.55",
      minQuantity: 25,
      isFeatured: false,
      templateWidth: 500,
      templateHeight: 500,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.05" },
      ],
      pricingTiers: [
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "1.00" },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.70" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.55" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.40" },
        { minQuantity: 500, maxQuantity: null, pricePerUnit: "0.30" },
      ],
    },
    // 6-11. Circle Stickers
    {
      categorySlug: "stickers",
      name: '1" Circle Stickers',
      slug: "circle-stickers-1",
      description: "Small 1 inch round stickers perfect for seals and labels.",
      basePrice: "0.15",
      minQuantity: 100,
      isFeatured: false,
      templateWidth: 100,
      templateHeight: 100,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
      ],
      pricingTiers: [
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.18" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.12" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.08" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.06" },
      ],
    },
    {
      categorySlug: "stickers",
      name: '1.5" Circle Stickers',
      slug: "circle-stickers-1-5",
      description: "1.5 inch round vinyl stickers. Great for product labels.",
      basePrice: "0.18",
      minQuantity: 100,
      isFeatured: false,
      templateWidth: 150,
      templateHeight: 150,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.02" },
      ],
      pricingTiers: [
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.20" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.14" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.10" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.07" },
      ],
    },
    {
      categorySlug: "stickers",
      name: '2" Circle Stickers',
      slug: "circle-stickers-2",
      description: "2 inch round vinyl stickers. Popular for logos and branding.",
      basePrice: "0.22",
      minQuantity: 50,
      isFeatured: true,
      templateWidth: 200,
      templateHeight: 200,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.03" },
        { type: "material", name: "Holographic Vinyl", value: "holographic", priceModifier: "0.06" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.35" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.22" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.16" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.12" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.09" },
      ],
    },
    {
      categorySlug: "stickers",
      name: '2.5" Circle Stickers',
      slug: "circle-stickers-2-5",
      description: "2.5 inch round vinyl stickers. Great balance of size and value.",
      basePrice: "0.26",
      minQuantity: 50,
      isFeatured: false,
      templateWidth: 250,
      templateHeight: 250,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.03" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.40" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.26" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.18" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.14" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.10" },
      ],
    },
    {
      categorySlug: "stickers",
      name: '3" Circle Stickers',
      slug: "circle-stickers-3",
      description: "3 inch round vinyl stickers. Perfect for larger logos and designs.",
      basePrice: "0.30",
      minQuantity: 50,
      isFeatured: true,
      templateWidth: 300,
      templateHeight: 300,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.04" },
        { type: "material", name: "Holographic Vinyl", value: "holographic", priceModifier: "0.08" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.50" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.30" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.22" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.16" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.12" },
      ],
    },
    {
      categorySlug: "stickers",
      name: '4" Circle Stickers',
      slug: "circle-stickers-4",
      description: "Large 4 inch round vinyl stickers. Maximum visibility for your brand.",
      basePrice: "0.45",
      minQuantity: 25,
      isFeatured: false,
      templateWidth: 400,
      templateHeight: 400,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.05" },
      ],
      pricingTiers: [
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "0.80" },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.55" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.45" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.32" },
        { minQuantity: 500, maxQuantity: null, pricePerUnit: "0.25" },
      ],
    },
    // 12-16. Rectangle/Square Stickers
    {
      categorySlug: "stickers",
      name: '2" x 1" Rectangle Stickers',
      slug: "rectangle-stickers-2x1",
      description: "Compact 2x1 inch rectangle stickers. Perfect for address labels and product tags.",
      basePrice: "0.18",
      minQuantity: 100,
      isFeatured: false,
      templateWidth: 200,
      templateHeight: 100,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Removable Adhesive", value: "removable", priceModifier: "0.02" },
      ],
      pricingTiers: [
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.20" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.14" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.10" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.07" },
      ],
    },
    {
      categorySlug: "stickers",
      name: '3" x 2" Rectangle Stickers',
      slug: "rectangle-stickers-3x2",
      description: "Versatile 3x2 inch rectangle stickers for branding and packaging.",
      basePrice: "0.24",
      minQuantity: 50,
      isFeatured: true,
      templateWidth: 300,
      templateHeight: 200,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.03" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.38" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.24" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.17" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.12" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.09" },
      ],
    },
    {
      categorySlug: "stickers",
      name: '4" x 2" Rectangle Stickers',
      slug: "rectangle-stickers-4x2",
      description: "Wide 4x2 inch rectangle stickers. Great for bumper stickers.",
      basePrice: "0.30",
      minQuantity: 50,
      isFeatured: false,
      templateWidth: 400,
      templateHeight: 200,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Permanent Adhesive", value: "permanent", priceModifier: "0.02" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.48" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.30" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.22" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.16" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.12" },
      ],
    },
    {
      categorySlug: "stickers",
      name: '4" x 3" Rectangle Stickers',
      slug: "rectangle-stickers-4x3",
      description: "Medium 4x3 inch rectangle stickers for detailed designs.",
      basePrice: "0.35",
      minQuantity: 50,
      isFeatured: false,
      templateWidth: 400,
      templateHeight: 300,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.04" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.55" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.35" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.26" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.20" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.15" },
      ],
    },
    {
      categorySlug: "stickers",
      name: '5" x 3" Rectangle Stickers',
      slug: "rectangle-stickers-5x3",
      description: "Large 5x3 inch rectangle stickers. Excellent for signage.",
      basePrice: "0.42",
      minQuantity: 25,
      isFeatured: false,
      templateWidth: 500,
      templateHeight: 300,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
      ],
      pricingTiers: [
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "0.75" },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.55" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.42" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.32" },
        { minQuantity: 500, maxQuantity: null, pricePerUnit: "0.24" },
      ],
    },
    // 17-19. Oval Stickers
    {
      categorySlug: "stickers",
      name: '1.5" x 1" Oval Stickers',
      slug: "oval-stickers-1-5x1",
      description: "Small 1.5x1 inch oval stickers. Perfect for elegant labels.",
      basePrice: "0.16",
      minQuantity: 100,
      isFeatured: false,
      templateWidth: 150,
      templateHeight: 100,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
      ],
      pricingTiers: [
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.18" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.13" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.09" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.07" },
      ],
    },
    {
      categorySlug: "stickers",
      name: '2" x 1" Oval Stickers',
      slug: "oval-stickers-2x1",
      description: "Classic 2x1 inch oval stickers. Great for vintage-style labels.",
      basePrice: "0.20",
      minQuantity: 100,
      isFeatured: false,
      templateWidth: 200,
      templateHeight: 100,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.02" },
      ],
      pricingTiers: [
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.22" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.15" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.11" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.08" },
      ],
    },
    {
      categorySlug: "stickers",
      name: '3" x 2" Oval Stickers',
      slug: "oval-stickers-3x2",
      description: "Medium 3x2 inch oval stickers. Elegant shape for premium labels.",
      basePrice: "0.28",
      minQuantity: 50,
      isFeatured: false,
      templateWidth: 300,
      templateHeight: 200,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.03" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.42" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.28" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.20" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.15" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.11" },
      ],
    },
    // 20-23. Sticker Sheets
    {
      categorySlug: "stickers",
      name: '4" x 6" Sticker Sheets',
      slug: "sticker-sheets-4x6",
      description: "4x6 inch sticker sheets with multiple die-cut stickers. Perfect for variety packs.",
      basePrice: "1.50",
      minQuantity: 25,
      isFeatured: false,
      templateWidth: 400,
      templateHeight: 600,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
      ],
      pricingTiers: [
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "2.20" },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "1.80" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "1.50" },
        { minQuantity: 250, maxQuantity: null, pricePerUnit: "1.20" },
      ],
    },
    {
      categorySlug: "stickers",
      name: '5" x 7" Sticker Sheets',
      slug: "sticker-sheets-5x7",
      description: "5x7 inch sticker sheets. More space for creative sticker designs.",
      basePrice: "2.00",
      minQuantity: 25,
      isFeatured: false,
      templateWidth: 500,
      templateHeight: 700,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
      ],
      pricingTiers: [
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "2.80" },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "2.30" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "2.00" },
        { minQuantity: 250, maxQuantity: null, pricePerUnit: "1.60" },
      ],
    },
    {
      categorySlug: "stickers",
      name: '8.5" x 11" Sticker Sheets',
      slug: "sticker-sheets-8-5x11",
      description: "Letter-size 8.5x11 inch sticker sheets. Maximum stickers per sheet.",
      basePrice: "3.50",
      minQuantity: 25,
      isFeatured: true,
      templateWidth: 550,
      templateHeight: 700,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.50" },
      ],
      pricingTiers: [
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "4.80" },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "4.00" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "3.50" },
        { minQuantity: 250, maxQuantity: null, pricePerUnit: "2.80" },
      ],
    },
    {
      categorySlug: "stickers",
      name: '11" x 17" Sticker Sheets',
      slug: "sticker-sheets-11x17",
      description: "Tabloid-size 11x17 inch sticker sheets. Our largest sticker sheet option.",
      basePrice: "6.00",
      minQuantity: 10,
      isFeatured: false,
      templateWidth: 550,
      templateHeight: 850,
      options: [
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
      ],
      pricingTiers: [
        { minQuantity: 10, maxQuantity: 24, pricePerUnit: "8.00" },
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "7.00" },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "6.00" },
        { minQuantity: 100, maxQuantity: null, pricePerUnit: "5.00" },
      ],
    },
    // ==================== FLYERS ====================
    // 24. 8.5x11 Flyers
    {
      categorySlug: "flyers",
      name: '8.5" x 11" Flyers',
      slug: "flyers-8-5x11",
      description: "Standard US letter size flyers. Full-color, double-sided printing on premium paper.",
      basePrice: "0.65",
      minQuantity: 25,
      isFeatured: true,
      templateWidth: 550,
      templateHeight: 700,
      options: [
        { type: "material", name: "80lb Gloss", value: "80gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "80lb Matte", value: "80matte", priceModifier: "0" },
        { type: "material", name: "100lb Gloss", value: "100gloss", priceModifier: "0.05" },
        { type: "material", name: "100lb Matte", value: "100matte", priceModifier: "0.05" },
        { type: "coating", name: "None", value: "none", priceModifier: "0", isDefault: true },
        { type: "coating", name: "UV Coating", value: "uv", priceModifier: "0.03" },
      ],
      pricingTiers: [
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "1.12" },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.80" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.65" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.42" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.28" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.16" },
      ],
    },
    // 25. 5.5x8.5 Flyers
    {
      categorySlug: "flyers",
      name: '5.5" x 8.5" Half-Letter Flyers',
      slug: "flyers-5-5x8-5",
      description: "Half-letter size flyers. Perfect for handouts and mailings.",
      basePrice: "0.50",
      minQuantity: 50,
      isFeatured: false,
      templateWidth: 550,
      templateHeight: 425,
      options: [
        { type: "material", name: "80lb Gloss", value: "80gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "80lb Matte", value: "80matte", priceModifier: "0" },
        { type: "material", name: "100lb Gloss", value: "100gloss", priceModifier: "0.03" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.70" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.50" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.40" },
        { minQuantity: 500, maxQuantity: null, pricePerUnit: "0.28" },
      ],
    },
    // 26. A6 Small Flyers
    {
      categorySlug: "flyers",
      name: 'A6 Small Flyers (4" x 6")',
      slug: "flyers-a6",
      description: "Compact A6 size flyers. Great for events and promotions.",
      basePrice: "0.30",
      minQuantity: 100,
      isFeatured: false,
      templateWidth: 400,
      templateHeight: 600,
      options: [
        { type: "material", name: "80lb Gloss", value: "80gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "80lb Matte", value: "80matte", priceModifier: "0" },
      ],
      pricingTiers: [
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.30" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.24" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.18" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.12" },
      ],
    },
    // 27. Square Flyers
    {
      categorySlug: "flyers",
      name: '6" x 6" Square Flyers',
      slug: "flyers-square",
      description: "Unique square flyers that stand out. Perfect for social media promotions.",
      basePrice: "0.35",
      minQuantity: 50,
      isFeatured: false,
      templateWidth: 600,
      templateHeight: 600,
      options: [
        { type: "material", name: "80lb Gloss", value: "80gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "80lb Matte", value: "80matte", priceModifier: "0" },
        { type: "material", name: "100lb Gloss", value: "100gloss", priceModifier: "0.05" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.60" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.40" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.30" },
        { minQuantity: 500, maxQuantity: null, pricePerUnit: "0.22" },
      ],
    },
    // 28. 11x17 Flyer/Poster
    {
      categorySlug: "flyers",
      name: '11" x 17" Tabloid Flyers',
      slug: "flyers-11x17",
      description: "Large tabloid size flyers. Maximum impact for your message.",
      basePrice: "0.60",
      minQuantity: 25,
      isFeatured: true,
      templateWidth: 550,
      templateHeight: 850,
      options: [
        { type: "material", name: "80lb Gloss", value: "80gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "80lb Matte", value: "80matte", priceModifier: "0" },
        { type: "material", name: "100lb Gloss", value: "100gloss", priceModifier: "0.10" },
        { type: "coating", name: "None", value: "none", priceModifier: "0", isDefault: true },
        { type: "coating", name: "UV Coating", value: "uv", priceModifier: "0.05" },
      ],
      pricingTiers: [
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "1.80" },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "1.20" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.80" },
        { minQuantity: 250, maxQuantity: null, pricePerUnit: "0.60" },
      ],
    },
    // ==================== BUSINESS CARDS ====================
    // 29-32. Business Cards
    {
      categorySlug: "business-cards",
      name: "Standard Business Cards (3.5\" x 2\")",
      slug: "business-cards-standard",
      description: "Classic 3.5x2 inch business cards on premium cardstock. Full-color, double-sided.",
      basePrice: "0.15",
      minQuantity: 100,
      isFeatured: true,
      templateWidth: 350,
      templateHeight: 200,
      options: [
        { type: "material", name: "14pt Matte", value: "14matte", priceModifier: "0", isDefault: true },
        { type: "material", name: "14pt Gloss", value: "14gloss", priceModifier: "0" },
        { type: "material", name: "16pt Matte", value: "16matte", priceModifier: "0.02" },
        { type: "material", name: "16pt Gloss", value: "16gloss", priceModifier: "0.02" },
        { type: "material", name: "18pt Silk", value: "18silk", priceModifier: "0.05" },
        { type: "coating", name: "None", value: "none", priceModifier: "0", isDefault: true },
        { type: "coating", name: "UV Coating", value: "uv", priceModifier: "0.02" },
        { type: "coating", name: "Soft Touch", value: "softtouch", priceModifier: "0.05" },
        { type: "coating", name: "Spot UV", value: "spotuv", priceModifier: "0.08" },
      ],
      pricingTiers: [
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.20" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.16" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.14" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.12" },
      ],
    },
    {
      categorySlug: "business-cards",
      name: "Rounded Corner Business Cards",
      slug: "business-cards-rounded",
      description: "Modern business cards with rounded corners. Contemporary look.",
      basePrice: "0.18",
      minQuantity: 100,
      isFeatured: false,
      templateWidth: 350,
      templateHeight: 200,
      options: [
        { type: "material", name: "14pt Matte", value: "14matte", priceModifier: "0", isDefault: true },
        { type: "material", name: "16pt Matte", value: "16matte", priceModifier: "0.02" },
        { type: "material", name: "18pt Silk", value: "18silk", priceModifier: "0.05" },
        { type: "coating", name: "None", value: "none", priceModifier: "0", isDefault: true },
        { type: "coating", name: "Soft Touch", value: "softtouch", priceModifier: "0.05" },
      ],
      pricingTiers: [
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.24" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.18" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.15" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.13" },
      ],
    },
    {
      categorySlug: "business-cards",
      name: "Square Business Cards (2.5\" x 2.5\")",
      slug: "business-cards-square",
      description: "Unique square business cards. Stand out from the crowd.",
      basePrice: "0.20",
      minQuantity: 100,
      isFeatured: false,
      templateWidth: 250,
      templateHeight: 250,
      options: [
        { type: "material", name: "14pt Matte", value: "14matte", priceModifier: "0", isDefault: true },
        { type: "material", name: "16pt Matte", value: "16matte", priceModifier: "0.03" },
        { type: "coating", name: "None", value: "none", priceModifier: "0", isDefault: true },
        { type: "coating", name: "Soft Touch", value: "softtouch", priceModifier: "0.05" },
      ],
      pricingTiers: [
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.28" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.20" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.17" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.14" },
      ],
    },
    {
      categorySlug: "business-cards",
      name: "Mini Business Cards (3\" x 1.5\")",
      slug: "business-cards-mini",
      description: "Compact mini business cards. Perfect for networking events.",
      basePrice: "0.12",
      minQuantity: 100,
      isFeatured: false,
      templateWidth: 300,
      templateHeight: 150,
      options: [
        { type: "material", name: "14pt Matte", value: "14matte", priceModifier: "0", isDefault: true },
        { type: "material", name: "14pt Gloss", value: "14gloss", priceModifier: "0" },
      ],
      pricingTiers: [
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.16" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.12" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.10" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.08" },
      ],
    },
    // ==================== POSTCARDS ====================
    // 33-35. Postcards
    {
      categorySlug: "postcards",
      name: '4" x 6" Postcards',
      slug: "postcards-4x6",
      description: "Standard 4x6 inch postcards. Perfect for direct mail campaigns.",
      basePrice: "0.40",
      minQuantity: 50,
      isFeatured: true,
      templateWidth: 400,
      templateHeight: 600,
      options: [
        { type: "material", name: "14pt Gloss", value: "14gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "14pt Matte", value: "14matte", priceModifier: "0" },
        { type: "material", name: "16pt Gloss", value: "16gloss", priceModifier: "0.05" },
        { type: "coating", name: "None", value: "none", priceModifier: "0", isDefault: true },
        { type: "coating", name: "UV Coating", value: "uv", priceModifier: "0.02" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.60" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.50" },
        { minQuantity: 250, maxQuantity: null, pricePerUnit: "0.38" },
      ],
    },
    {
      categorySlug: "postcards",
      name: '5" x 7" Postcards',
      slug: "postcards-5x7",
      description: "Larger 5x7 inch postcards. More space for your message.",
      basePrice: "0.50",
      minQuantity: 50,
      isFeatured: false,
      templateWidth: 500,
      templateHeight: 700,
      options: [
        { type: "material", name: "14pt Gloss", value: "14gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "14pt Matte", value: "14matte", priceModifier: "0" },
        { type: "material", name: "16pt Gloss", value: "16gloss", priceModifier: "0.05" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.75" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.60" },
        { minQuantity: 250, maxQuantity: null, pricePerUnit: "0.45" },
      ],
    },
    {
      categorySlug: "postcards",
      name: '6" x 9" Jumbo Postcards',
      slug: "postcards-6x9",
      description: "Jumbo 6x9 inch postcards. Maximum impact for mailers.",
      basePrice: "0.70",
      minQuantity: 50,
      isFeatured: false,
      templateWidth: 600,
      templateHeight: 900,
      options: [
        { type: "material", name: "14pt Gloss", value: "14gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "16pt Gloss", value: "16gloss", priceModifier: "0.08" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "1.00" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.80" },
        { minQuantity: 250, maxQuantity: null, pricePerUnit: "0.60" },
      ],
    },
    // ==================== BROCHURES ====================
    // 36-38. Brochures
    {
      categorySlug: "brochures",
      name: "Tri-Fold Brochures (8.5\" x 11\")",
      slug: "brochures-trifold",
      description: "Classic tri-fold brochures. Full-color printing on both sides.",
      basePrice: "0.70",
      minQuantity: 100,
      isFeatured: true,
      templateWidth: 700,
      templateHeight: 550,
      options: [
        { type: "material", name: "80lb Gloss", value: "80gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "80lb Matte", value: "80matte", priceModifier: "0" },
        { type: "material", name: "100lb Gloss", value: "100gloss", priceModifier: "0.10" },
      ],
      pricingTiers: [
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.90" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.70" },
        { minQuantity: 500, maxQuantity: null, pricePerUnit: "0.50" },
      ],
    },
    {
      categorySlug: "brochures",
      name: "Bi-Fold Brochures (8.5\" x 11\")",
      slug: "brochures-bifold",
      description: "Half-fold brochures with 4 panels. Ideal for menus and programs.",
      basePrice: "0.65",
      minQuantity: 100,
      isFeatured: false,
      templateWidth: 700,
      templateHeight: 550,
      options: [
        { type: "material", name: "80lb Gloss", value: "80gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "80lb Matte", value: "80matte", priceModifier: "0" },
        { type: "material", name: "100lb Gloss", value: "100gloss", priceModifier: "0.10" },
      ],
      pricingTiers: [
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.85" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.65" },
        { minQuantity: 500, maxQuantity: null, pricePerUnit: "0.48" },
      ],
    },
    {
      categorySlug: "brochures",
      name: "Z-Fold Brochures (8.5\" x 11\")",
      slug: "brochures-zfold",
      description: "Accordion-style Z-fold brochures. Unique presentation style.",
      basePrice: "0.75",
      minQuantity: 100,
      isFeatured: false,
      templateWidth: 700,
      templateHeight: 550,
      options: [
        { type: "material", name: "80lb Gloss", value: "80gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "100lb Gloss", value: "100gloss", priceModifier: "0.10" },
      ],
      pricingTiers: [
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.95" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.75" },
        { minQuantity: 500, maxQuantity: null, pricePerUnit: "0.55" },
      ],
    },
    // ==================== POSTERS ====================
    // 39-42. Posters
    {
      categorySlug: "posters",
      name: '11" x 17" Posters',
      slug: "posters-11x17",
      description: "Tabloid size posters. Great for in-store displays and events.",
      basePrice: "1.20",
      minQuantity: 25,
      isFeatured: true,
      templateWidth: 550,
      templateHeight: 850,
      options: [
        { type: "material", name: "80lb Gloss", value: "80gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "80lb Matte", value: "80matte", priceModifier: "0" },
        { type: "material", name: "100lb Gloss", value: "100gloss", priceModifier: "0.20" },
        { type: "coating", name: "None", value: "none", priceModifier: "0", isDefault: true },
        { type: "coating", name: "UV Coating", value: "uv", priceModifier: "0.10" },
      ],
      pricingTiers: [
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "2.00" },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "1.50" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "1.20" },
        { minQuantity: 250, maxQuantity: null, pricePerUnit: "0.90" },
      ],
    },
    {
      categorySlug: "posters",
      name: '18" x 24" Posters',
      slug: "posters-18x24",
      description: "Medium format posters. High-impact advertising.",
      basePrice: "2.50",
      minQuantity: 10,
      isFeatured: false,
      templateWidth: 450,
      templateHeight: 600,
      options: [
        { type: "material", name: "80lb Gloss", value: "80gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "100lb Gloss", value: "100gloss", priceModifier: "0.30" },
        { type: "material", name: "Photo Satin", value: "satin", priceModifier: "0.50" },
      ],
      pricingTiers: [
        { minQuantity: 10, maxQuantity: 24, pricePerUnit: "4.00" },
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "3.00" },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "2.50" },
        { minQuantity: 100, maxQuantity: null, pricePerUnit: "2.00" },
      ],
    },
    {
      categorySlug: "posters",
      name: '24" x 36" Large Posters',
      slug: "posters-24x36",
      description: "Large format posters. Perfect for movie posters and storefronts.",
      basePrice: "4.00",
      minQuantity: 5,
      isFeatured: true,
      templateWidth: 400,
      templateHeight: 600,
      options: [
        { type: "material", name: "80lb Gloss", value: "80gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "100lb Gloss", value: "100gloss", priceModifier: "0.50" },
        { type: "material", name: "Photo Satin", value: "satin", priceModifier: "1.00" },
        { type: "material", name: "Canvas", value: "canvas", priceModifier: "3.00" },
      ],
      pricingTiers: [
        { minQuantity: 5, maxQuantity: 9, pricePerUnit: "7.00" },
        { minQuantity: 10, maxQuantity: 24, pricePerUnit: "5.50" },
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "4.50" },
        { minQuantity: 50, maxQuantity: null, pricePerUnit: "4.00" },
      ],
    },
    {
      categorySlug: "posters",
      name: '36" x 48" Extra Large Posters',
      slug: "posters-36x48",
      description: "Extra large format posters. Maximum visibility for events.",
      basePrice: "8.00",
      minQuantity: 5,
      isFeatured: false,
      templateWidth: 450,
      templateHeight: 600,
      options: [
        { type: "material", name: "80lb Gloss", value: "80gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "100lb Gloss", value: "100gloss", priceModifier: "1.00" },
        { type: "material", name: "Photo Satin", value: "satin", priceModifier: "2.00" },
      ],
      pricingTiers: [
        { minQuantity: 5, maxQuantity: 9, pricePerUnit: "12.00" },
        { minQuantity: 10, maxQuantity: 24, pricePerUnit: "10.00" },
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "8.50" },
        { minQuantity: 50, maxQuantity: null, pricePerUnit: "7.00" },
      ],
    },
  ];

  console.log(`Total products to add: ${productsData.length}`);

  // Insert products
  for (const productData of productsData) {
    const existingProduct = await db.select().from(products).where(eq(products.slug, productData.slug));
    
    if (existingProduct.length > 0) {
      console.log(`Product exists: ${productData.name}`);
      continue;
    }

    const categoryId = insertedCategories[productData.categorySlug];
    if (!categoryId) {
      console.log(`Category not found for: ${productData.name}`);
      continue;
    }

    // Insert product
    const [insertedProduct] = await db.insert(products).values({
      categoryId,
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      basePrice: productData.basePrice,
      minQuantity: productData.minQuantity,
      isFeatured: productData.isFeatured,
      templateWidth: productData.templateWidth,
      templateHeight: productData.templateHeight,
      isActive: true,
    }).returning();

    console.log(`Created product: ${productData.name}`);

    // Insert options
    for (let i = 0; i < productData.options.length; i++) {
      const opt = productData.options[i];
      await db.insert(productOptions).values({
        productId: insertedProduct.id,
        optionType: opt.type as any,
        name: opt.name,
        value: opt.value,
        priceModifier: opt.priceModifier,
        isDefault: opt.isDefault || false,
        displayOrder: i,
      });
    }

    // Insert pricing tiers
    for (const tier of productData.pricingTiers) {
      await db.insert(pricingTiers).values({
        productId: insertedProduct.id,
        minQuantity: tier.minQuantity,
        maxQuantity: tier.maxQuantity,
        pricePerUnit: tier.pricePerUnit,
      });
    }
  }

  console.log("Full product catalog seed completed!");
}

seedFullCatalog().catch(console.error);
