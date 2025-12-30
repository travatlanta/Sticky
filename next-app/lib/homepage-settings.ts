import { z } from 'zod';

export const heroLoggedInSchema = z.object({
  welcomePrefix: z.string(),
  headline: z.string(),
  description: z.string(),
  primaryButtonText: z.string(),
  secondaryButtonText: z.string(),
});

export const heroLoggedOutSchema = z.object({
  headlineTop: z.string(),
  headlineBottom: z.string(),
  description: z.string(),
  primaryButtonText: z.string(),
  secondaryButtonText: z.string(),
});

export const heroSectionSchema = z.object({
  loggedIn: heroLoggedInSchema,
  loggedOut: heroLoggedOutSchema,
  badge: z.string(),
});

export const featureCardSchema = z.object({
  title: z.string(),
  description: z.string(),
  iconName: z.string(),
  gradient: z.string(),
});

export const featuresSectionSchema = z.object({
  cards: z.array(featureCardSchema),
});

export const customStickersSectionSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  cardTitle: z.string(),
  cardSubtitle: z.string(),
  buttonText: z.string(),
});

export const stickersThatStickSectionSchema = z.object({
  badge: z.string(),
  title: z.string(),
  description: z.string(),
  features: z.array(z.string()),
  buttonText: z.string(),
  priceText: z.string(),
});

export const labelCardSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  iconName: z.string(),
  gradient: z.string(),
  linkCategory: z.string(),
  isPopular: z.boolean().optional(),
});

export const labelsSectionSchema = z.object({
  badge: z.string(),
  title: z.string(),
  description: z.string(),
  cards: z.array(labelCardSchema),
  primaryButtonText: z.string(),
  secondaryButtonText: z.string(),
});

export const popularProductSchema = z.object({
  title: z.string(),
  description: z.string(),
  price: z.string(),
  iconName: z.string(),
  gradient: z.string(),
  linkUrl: z.string(),
});

export const popularProductsSectionSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  products: z.array(popularProductSchema),
});

export const ctaSectionSchema = z.object({
  title: z.string(),
  description: z.string(),
  buttonText: z.string(),
});

export const homepageSettingsSchema = z.object({
  hero: heroSectionSchema,
  features: featuresSectionSchema,
  customStickers: customStickersSectionSchema,
  stickersThatStick: stickersThatStickSectionSchema,
  labels: labelsSectionSchema,
  popularProducts: popularProductsSectionSchema,
  cta: ctaSectionSchema,
});

export const themeSettingsSchema = z.object({
  primaryColor: z.string(),
  accentColor: z.string(),
  backgroundColor: z.string(),
});

export type HeroSection = z.infer<typeof heroSectionSchema>;
export type FeaturesSection = z.infer<typeof featuresSectionSchema>;
export type CustomStickersSection = z.infer<typeof customStickersSectionSchema>;
export type StickersThatStickSection = z.infer<typeof stickersThatStickSectionSchema>;
export type LabelsSection = z.infer<typeof labelsSectionSchema>;
export type PopularProductsSection = z.infer<typeof popularProductsSectionSchema>;
export type CtaSection = z.infer<typeof ctaSectionSchema>;
export type HomepageSettings = z.infer<typeof homepageSettingsSchema>;
export type ThemeSettings = z.infer<typeof themeSettingsSchema>;

export const defaultHomepageSettings: HomepageSettings = {
  hero: {
    loggedIn: {
      welcomePrefix: 'Welcome back',
      headline: "Let's Create",
      description: 'Design stunning custom stickers and labels with our easy-to-use editor. Premium quality, weatherproof materials, fast delivery.',
      primaryButtonText: 'Browse Products',
      secondaryButtonText: 'My Account',
    },
    loggedOut: {
      headlineTop: 'Custom Stickers',
      headlineBottom: 'Made Easy',
      description: 'Design stunning custom stickers and labels with our easy-to-use editor. Premium quality, weatherproof materials, fast delivery.',
      primaryButtonText: 'Browse Products',
      secondaryButtonText: 'Sign In to Start',
    },
    badge: 'Premium Quality Stickers',
  },
  features: {
    cards: [
      { title: 'Easy Design Editor', description: 'Create custom designs with our intuitive online editor', iconName: 'Palette', gradient: 'orange' },
      { title: 'Premium Quality', description: 'High-quality materials and vibrant, long-lasting prints', iconName: 'Sparkles', gradient: 'green' },
      { title: 'Fast Shipping', description: 'Quick turnaround and reliable delivery to your door', iconName: 'Truck', gradient: 'blue' },
      { title: 'Satisfaction Guarantee', description: '100% satisfaction or your money back', iconName: 'Shield', gradient: 'purple' },
    ],
  },
  customStickers: {
    title: 'Custom Stickers',
    subtitle: 'Stick it anywhere. Make it yours.',
    cardTitle: 'Die-Cut, Circles, Sheets & More',
    cardSubtitle: 'Starting at just $0.10/sticker',
    buttonText: 'Design Your Stickers',
  },
  stickersThatStick: {
    badge: 'Premium Quality',
    title: 'Stickers That Stick',
    description: 'From branding to personal expression, our vibrant custom stickers make your designs pop. Available in any shape or size with weatherproof options.',
    features: [
      'Full-color, high-resolution printing',
      'Premium vinyl & matte finishes',
      'Waterproof & UV resistant',
    ],
    buttonText: 'Browse Stickers',
    priceText: 'From $0.10/sticker',
  },
  labels: {
    badge: 'For Your Business',
    title: 'Labels That Make An Impression',
    description: 'Professional labels for products, packaging, and bottles. Perfect for small businesses, craft breweries, candle makers, and more.',
    cards: [
      { title: 'Product Labels', subtitle: 'Custom sizes', iconName: 'Tag', gradient: 'amber-orange', linkCategory: 'labels', isPopular: false },
      { title: 'Bottle Labels', subtitle: 'Wine, Beer, Candles', iconName: 'Wine', gradient: 'orange-red', linkCategory: 'bottle-labels', isPopular: true },
      { title: 'Packaging', subtitle: 'Roll & Sheet', iconName: 'Package', gradient: 'teal-cyan', linkCategory: 'labels', isPopular: false },
    ],
    primaryButtonText: 'Shop Labels',
    secondaryButtonText: 'Shop Bottle Labels',
  },
  popularProducts: {
    title: 'Popular Products',
    subtitle: 'Start creating with our most loved print products',
    products: [
      { title: 'Die-Cut Stickers', description: 'Custom shapes, cut to your design', price: 'Starting at $4.99', iconName: 'Sticker', gradient: 'pink-orange-yellow', linkUrl: '/products?category=stickers' },
      { title: 'Circle Stickers', description: 'Perfect rounds for logos and badges', price: 'Starting at $4.99', iconName: 'Circle', gradient: 'blue-purple', linkUrl: '/products?category=stickers' },
      { title: 'Sheet Stickers', description: 'Multiple stickers on one sheet', price: 'Starting at $6.99', iconName: 'Layers', gradient: 'green-teal', linkUrl: '/products?category=stickers' },
    ],
  },
  cta: {
    title: 'Ready to Create Something Amazing?',
    description: 'Join thousands of satisfied customers who trust Sticky Banditos for their custom printing needs.',
    buttonText: 'Start Designing',
  },
};

export const defaultThemeSettings: ThemeSettings = {
  primaryColor: '#f97316',
  accentColor: '#fb923c',
  backgroundColor: '#ffffff',
};
