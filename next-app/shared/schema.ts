import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  pgEnum,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  serial,
} from "drizzle-orm/pg-core";

// Enums
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "in_production",
  "printed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const designStatusEnum = pgEnum("design_status", [
  "draft",
  "submitted",
  "approved",
]);

export const optionTypeEnum = pgEnum("option_type", [
  "size",
  "material",
  "coating",
  "shape",
]);

export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed",
]);

export const senderTypeEnum = pgEnum("sender_type", ["user", "admin"]);

// Shipping type enum for per-product shipping settings.  Allowed values are
// 'free' (no shipping cost), 'flat' (fixed shipping cost per product), and
// 'calculated' (use automatic/global shipping calculation). The default is
// 'calculated' when creating new products.
export const shippingTypeEnum = pgEnum("shipping_type", ["free", "flat", "calculated"]);

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({ expireIdx: index("IDX_session_expire").on(table.expire) })
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  profileImageUrl: varchar("profile_image_url"),
  googleId: varchar("google_id").unique(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin invitations for invite/revoke functionality
export const adminInvitations = pgTable("admin_invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  invitedBy: varchar("invited_by").references(() => users.id),
  invitationToken: varchar("invitation_token"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, accepted, revoked
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  revokedAt: timestamp("revoked_at"),
});

// Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  minQuantity: integer("min_quantity").default(1),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  // Print dimensions in inches and DPI for accurate canvas sizing
  printWidthInches: decimal("print_width_inches", { precision: 6, scale: 3 }).default("4"),
  printHeightInches: decimal("print_height_inches", { precision: 6, scale: 3 }).default("4"),
  printDpi: integer("print_dpi").default(300),
  // Legacy fields - kept for compatibility but computed from inches/DPI
  templateWidth: integer("template_width").default(300),
  templateHeight: integer("template_height").default(300),
  bleedSize: decimal("bleed_size", { precision: 4, scale: 3 }).default("0.125"),
  safeZoneSize: decimal("safe_zone_size", { precision: 4, scale: 3 }).default("0.125"),
  supportsCustomShape: boolean("supports_custom_shape").default(false),

  // Per‑product shipping configuration.  If shippingType is 'flat', a
  // flatShippingPrice must be provided; otherwise it can be null.  When
  // shippingType is 'free', shipping is free and flatShippingPrice is ignored.
  // When shippingType is 'calculated', the system will fall back to global or
  // automatically calculated shipping rates.
  shippingType: shippingTypeEnum("shipping_type").default("calculated"),
  flatShippingPrice: decimal("flat_shipping_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product Options (sizes, materials, coatings)
export const productOptions = pgTable("product_options", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  optionType: optionTypeEnum("option_type").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  value: varchar("value", { length: 100 }),
  priceModifier: decimal("price_modifier", { precision: 10, scale: 2 }).default(
    "0"
  ),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
});

// Pricing Tiers (quantity breaks)
export const pricingTiers = pgTable("pricing_tiers", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  minQuantity: integer("min_quantity").notNull(),
  maxQuantity: integer("max_quantity"),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 4 }).notNull(),
});

// Product Images
export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  imageUrl: varchar("image_url").notNull(),
  altText: varchar("alt_text", { length: 200 }),
  displayOrder: integer("display_order").default(0),
});

// Product Templates (pre-designed templates for products)
export const productTemplates = pgTable("product_templates", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  previewImageUrl: varchar("preview_image_url"),
  canvasJson: jsonb("canvas_json"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Designs
export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  productId: integer("product_id").references(() => products.id),
  name: varchar("name", { length: 200 }),
  canvasJson: jsonb("canvas_json"),
  previewUrl: varchar("preview_url"),
  customShapeUrl: varchar("custom_shape_url"),
  contourPath: text("contour_path"), // SVG path for die-cut contour
  highResExportUrl: varchar("high_res_export_url"),
  status: designStatusEnum("status").default("draft"),
  selectedOptions: jsonb("selected_options"),
  bleedColor: varchar("bleed_color", { length: 20 }).default("#ffffff"),
  lastAutoSave: timestamp("last_auto_save"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cart
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cart Items
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id")
    .references(() => carts.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  designId: integer("design_id").references(() => designs.id),
  quantity: integer("quantity").notNull().default(1),
  selectedOptions: jsonb("selected_options"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  status: orderStatusEnum("status").default("pending"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default(
    "15.00"
  ),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", {
    precision: 10,
    scale: 2,
  }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: jsonb("shipping_address"),
  billingAddress: jsonb("billing_address"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  trackingNumber: varchar("tracking_number"),
  trackingCarrier: varchar("tracking_carrier"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order Items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  designId: integer("design_id").references(() => designs.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  selectedOptions: jsonb("selected_options"),
  printFileUrl: varchar("print_file_url"),
});

// Promotions
export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxUses: integer("max_uses"),
  usesCount: integer("uses_count").default(0),
  usesPerUser: integer("uses_per_user").default(1),
  isActive: boolean("is_active").default(true),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  userId: varchar("user_id").references(() => users.id),
  senderType: senderTypeEnum("sender_type").notNull(),
  content: text("content").notNull(),
  attachments: jsonb("attachments"),
  isRead: boolean("is_read").default(false),
  isFromHuman: boolean("is_from_human").default(false),
  needsHumanSupport: boolean("needs_human_support").default(false),
  escalatedAt: timestamp("escalated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Deals (promotional cards for hot deals section)
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  dealPrice: decimal("deal_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity"), // e.g., "100" stickers
  productSize: varchar("product_size", { length: 50 }), // e.g., "3 inch"
  productType: varchar("product_type", { length: 100 }), // e.g., "Die-Cut Stickers"
  linkUrl: varchar("link_url", { length: 500 }), // Link when clicked
  badgeText: varchar("badge_text", { length: 50 }), // e.g., "HOT", "BEST VALUE"
  badgeColor: varchar("badge_color", { length: 50 }).default("yellow"), // yellow, green, red, purple
  ctaText: varchar("cta_text", { length: 50 }).default("Shop Now"), // Call to action button text
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  showOnHomepage: boolean("show_on_homepage").default(false), // Featured on home page
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Site Settings
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  designs: many(designs),
  orders: many(orders),
  messages: many(messages),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  options: many(productOptions),
  pricingTiers: many(pricingTiers),
  images: many(productImages),
  templates: many(productTemplates),
  designs: many(designs),
}));

export const productTemplatesRelations = relations(productTemplates, ({ one }) => ({
  product: one(products, {
    fields: [productTemplates.productId],
    references: [products.id],
  }),
}));

export const productOptionsRelations = relations(productOptions, ({ one }) => ({
  product: one(products, {
    fields: [productOptions.productId],
    references: [products.id],
  }),
}));

export const pricingTiersRelations = relations(pricingTiers, ({ one }) => ({
  product: one(products, {
    fields: [pricingTiers.productId],
    references: [products.id],
  }),
}));

export const designsRelations = relations(designs, ({ one }) => ({
  user: one(users, {
    fields: [designs.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [designs.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  messages: many(messages),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  design: one(designs, {
    fields: [orderItems.designId],
    references: [designs.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  order: one(orders, {
    fields: [messages.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type ProductOption = typeof productOptions.$inferSelect;
export type InsertProductOption = typeof productOptions.$inferInsert;
export type PricingTier = typeof pricingTiers.$inferSelect;
export type Design = typeof designs.$inferSelect;
export type InsertDesign = typeof designs.$inferInsert;
export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;
export type AdminInvitation = typeof adminInvitations.$inferSelect;
export type InsertAdminInvitation = typeof adminInvitations.$inferInsert;
export type ProductTemplate = typeof productTemplates.$inferSelect;
export type InsertProductTemplate = typeof productTemplates.$inferInsert;
