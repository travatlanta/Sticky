import { db } from "./db";
import { categories, products, productOptions, pricingTiers } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedProducts() {
  console.log("Starting product seed...");

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

  // Products data
  const productsData = [
    // STICKERS
    {
      categorySlug: "stickers",
      name: "Custom Die-Cut Stickers",
      slug: "custom-die-cut-stickers",
      description: "Premium vinyl die-cut stickers in any shape. Full-color printing with gloss or matte finish. Perfect for branding, packaging, and promotions.",
      basePrice: "0.29",
      minQuantity: 50,
      isFeatured: true,
      templateWidth: 300,
      templateHeight: 300,
      options: [
        { type: "size", name: '2" x 2"', value: "2x2", priceModifier: "0", isDefault: true },
        { type: "size", name: '3" x 3"', value: "3x3", priceModifier: "0.05" },
        { type: "size", name: '4" x 4"', value: "4x4", priceModifier: "0.10" },
        { type: "size", name: '5" x 5"', value: "5x5", priceModifier: "0.15" },
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
    {
      categorySlug: "stickers",
      name: "Circle Stickers",
      slug: "circle-stickers",
      description: "Round vinyl stickers perfect for logos, seals, and labels. Full-color printing with gloss or matte finish.",
      basePrice: "0.25",
      minQuantity: 50,
      isFeatured: false,
      templateWidth: 300,
      templateHeight: 300,
      options: [
        { type: "size", name: '1" Circle', value: "1", priceModifier: "0", isDefault: true },
        { type: "size", name: '1.5" Circle', value: "1.5", priceModifier: "0.02" },
        { type: "size", name: '2" Circle', value: "2", priceModifier: "0.05" },
        { type: "size", name: '2.5" Circle', value: "2.5", priceModifier: "0.08" },
        { type: "size", name: '3" Circle', value: "3", priceModifier: "0.10" },
        { type: "size", name: '4" Circle', value: "4", priceModifier: "0.15" },
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
        { type: "material", name: "Clear Vinyl", value: "clear", priceModifier: "0.03" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.45" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.25" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.18" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.14" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.10" },
      ],
    },
    {
      categorySlug: "stickers",
      name: "Square & Rectangle Stickers",
      slug: "square-rectangle-stickers",
      description: "Versatile square and rectangle stickers for product labels, packaging, and branding.",
      basePrice: "0.25",
      minQuantity: 50,
      isFeatured: false,
      templateWidth: 400,
      templateHeight: 200,
      options: [
        { type: "size", name: '2" x 1"', value: "2x1", priceModifier: "0", isDefault: true },
        { type: "size", name: '3" x 2"', value: "3x2", priceModifier: "0.03" },
        { type: "size", name: '4" x 2"', value: "4x2", priceModifier: "0.06" },
        { type: "size", name: '4" x 3"', value: "4x3", priceModifier: "0.08" },
        { type: "size", name: '5" x 3"', value: "5x3", priceModifier: "0.12" },
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.40" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.25" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.18" },
        { minQuantity: 500, maxQuantity: 999, pricePerUnit: "0.14" },
        { minQuantity: 1000, maxQuantity: null, pricePerUnit: "0.10" },
      ],
    },
    {
      categorySlug: "stickers",
      name: "Sticker Sheets",
      slug: "sticker-sheets",
      description: "Custom sticker sheets with multiple designs. Perfect for giveaways, retail, and merchandise.",
      basePrice: "1.50",
      minQuantity: 25,
      isFeatured: true,
      templateWidth: 500,
      templateHeight: 700,
      options: [
        { type: "size", name: '4" x 6" Sheet', value: "4x6", priceModifier: "0", isDefault: true },
        { type: "size", name: '5" x 7" Sheet', value: "5x7", priceModifier: "0.50" },
        { type: "size", name: '8.5" x 11" Sheet', value: "8.5x11", priceModifier: "1.50" },
        { type: "size", name: '11" x 17" Sheet', value: "11x17", priceModifier: "3.00" },
        { type: "material", name: "Gloss Vinyl", value: "gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "Matte Vinyl", value: "matte", priceModifier: "0" },
      ],
      pricingTiers: [
        { minQuantity: 25, maxQuantity: 49, pricePerUnit: "2.50" },
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "2.00" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "1.50" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "1.20" },
        { minQuantity: 500, maxQuantity: null, pricePerUnit: "1.00" },
      ],
    },

    // FLYERS
    {
      categorySlug: "flyers",
      name: '8.5" x 11" Flyers',
      slug: "standard-flyers",
      description: "Standard US letter size flyers. Full-color, double-sided printing on premium paper.",
      basePrice: "0.64",
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
    {
      categorySlug: "flyers",
      name: '5.5" x 8.5" Half-Letter Flyers',
      slug: "half-letter-flyers",
      description: "Half-letter size flyers perfect for handouts and mailings. Full-color printing.",
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
    {
      categorySlug: "flyers",
      name: "Square Flyers",
      slug: "square-flyers",
      description: "Unique square flyers that stand out. Perfect for social media promotion.",
      basePrice: "0.35",
      minQuantity: 50,
      isFeatured: false,
      templateWidth: 500,
      templateHeight: 500,
      options: [
        { type: "size", name: '5" x 5"', value: "5x5", priceModifier: "0", isDefault: true },
        { type: "size", name: '6" x 6"', value: "6x6", priceModifier: "0.10" },
        { type: "material", name: "80lb Gloss", value: "80gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "80lb Matte", value: "80matte", priceModifier: "0" },
      ],
      pricingTiers: [
        { minQuantity: 50, maxQuantity: 99, pricePerUnit: "0.60" },
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.40" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.30" },
        { minQuantity: 500, maxQuantity: null, pricePerUnit: "0.22" },
      ],
    },

    // BUSINESS CARDS
    {
      categorySlug: "business-cards",
      name: "Standard Business Cards",
      slug: "standard-business-cards",
      description: "Professional 3.5\" x 2\" business cards on premium cardstock. Full-color, double-sided.",
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
      slug: "rounded-business-cards",
      description: "Modern business cards with rounded corners for a softer, contemporary look.",
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

    // POSTCARDS
    {
      categorySlug: "postcards",
      name: '4" x 6" Postcards',
      slug: "postcards-4x6",
      description: "Standard postcard size. Perfect for direct mail campaigns and promotions.",
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
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.38" },
        { minQuantity: 500, maxQuantity: null, pricePerUnit: "0.28" },
      ],
    },
    {
      categorySlug: "postcards",
      name: '5" x 7" Postcards',
      slug: "postcards-5x7",
      description: "Larger postcard format for more visual impact. Great for event invitations.",
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
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.45" },
        { minQuantity: 500, maxQuantity: null, pricePerUnit: "0.35" },
      ],
    },

    // BROCHURES
    {
      categorySlug: "brochures",
      name: "Tri-Fold Brochures",
      slug: "tri-fold-brochures",
      description: "Classic tri-fold brochures. Full-color printing on both sides with professional folding.",
      basePrice: "0.70",
      minQuantity: 100,
      isFeatured: true,
      templateWidth: 700,
      templateHeight: 550,
      options: [
        { type: "size", name: '8.5" x 11" (folds to 3.67" x 8.5")', value: "letter", priceModifier: "0", isDefault: true },
        { type: "size", name: '8.5" x 14" (folds to 4.67" x 8.5")', value: "legal", priceModifier: "0.15" },
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
      name: "Bi-Fold Brochures",
      slug: "bi-fold-brochures",
      description: "Half-fold brochures with 4 panels. Ideal for menus, programs, and presentations.",
      basePrice: "0.65",
      minQuantity: 100,
      isFeatured: false,
      templateWidth: 700,
      templateHeight: 550,
      options: [
        { type: "size", name: '8.5" x 11" (folds to 5.5" x 8.5")', value: "letter", priceModifier: "0", isDefault: true },
        { type: "size", name: '11" x 17" (folds to 8.5" x 11")', value: "tabloid", priceModifier: "0.25" },
        { type: "material", name: "80lb Gloss", value: "80gloss", priceModifier: "0", isDefault: true },
        { type: "material", name: "100lb Gloss", value: "100gloss", priceModifier: "0.10" },
      ],
      pricingTiers: [
        { minQuantity: 100, maxQuantity: 249, pricePerUnit: "0.85" },
        { minQuantity: 250, maxQuantity: 499, pricePerUnit: "0.65" },
        { minQuantity: 500, maxQuantity: null, pricePerUnit: "0.48" },
      ],
    },

    // POSTERS
    {
      categorySlug: "posters",
      name: '11" x 17" Posters',
      slug: "posters-11x17",
      description: "Tabloid size posters. Great for events, promotions, and in-store displays.",
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
      description: "Medium format posters for high-impact advertising and events.",
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
      description: "Large format posters for maximum visibility. Perfect for movie posters, events, and storefronts.",
      basePrice: "4.00",
      minQuantity: 5,
      isFeatured: false,
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
  ];

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
    console.log(`  Added ${productData.options.length} options`);

    // Insert pricing tiers
    for (const tier of productData.pricingTiers) {
      await db.insert(pricingTiers).values({
        productId: insertedProduct.id,
        minQuantity: tier.minQuantity,
        maxQuantity: tier.maxQuantity,
        pricePerUnit: tier.pricePerUnit,
      });
    }
    console.log(`  Added ${productData.pricingTiers.length} pricing tiers`);
  }

  console.log("Product seed completed!");
}

seedProducts().catch(console.error);
