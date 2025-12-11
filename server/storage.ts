import {
  users,
  categories,
  products,
  productOptions,
  pricingTiers,
  productImages,
  productTemplates,
  designs,
  carts,
  cartItems,
  orders,
  orderItems,
  promotions,
  messages,
  siteSettings,
  deals,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type ProductOption,
  type InsertProductOption,
  type PricingTier,
  type Design,
  type InsertDesign,
  type Cart,
  type CartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type Promotion,
  type Message,
  type SiteSetting,
  type Deal,
  type InsertDeal,
  type ProductTemplate,
  type InsertProductTemplate,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, or, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Product operations
  getProducts(filters?: { categoryId?: number; isActive?: boolean; isFeatured?: boolean }): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductById(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;

  // Product options
  getProductOptions(productId: number): Promise<ProductOption[]>;
  createProductOption(option: InsertProductOption): Promise<ProductOption>;

  // Pricing tiers
  getPricingTiers(productId: number): Promise<PricingTier[]>;

  // Design operations
  getDesignsByUser(userId: string): Promise<Design[]>;
  getDesignById(id: number): Promise<Design | undefined>;
  createDesign(design: InsertDesign): Promise<Design>;
  updateDesign(id: number, design: Partial<InsertDesign>): Promise<Design | undefined>;

  // Cart operations
  getCartByUserId(userId: string): Promise<Cart | undefined>;
  getCartBySessionId(sessionId: string): Promise<Cart | undefined>;
  createCart(userId?: string, sessionId?: string): Promise<Cart>;
  getCartItems(cartId: number): Promise<CartItem[]>;
  addCartItem(cartId: number, item: Partial<CartItem>): Promise<CartItem>;
  updateCartItem(id: number, updates: Partial<CartItem>): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<void>;
  clearCart(cartId: number): Promise<void>;

  // Order operations
  getOrdersByUser(userId: string): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: Partial<OrderItem>): Promise<OrderItem>;

  // Promotion operations
  getPromotionByCode(code: string): Promise<Promotion | undefined>;
  validatePromotion(code: string, orderAmount: number): Promise<{ valid: boolean; discount?: number; message?: string }>;
  getAllPromotions(): Promise<Promotion[]>;
  getPromotionById(id: number): Promise<Promotion | undefined>;
  createPromotion(promo: Partial<Promotion>): Promise<Promotion>;
  updatePromotion(id: number, updates: Partial<Promotion>): Promise<Promotion | undefined>;
  deletePromotion(id: number): Promise<void>;

  // Admin operations
  getAdminStats(): Promise<{ orderCount: number; revenue: number; productCount: number; userCount: number }>;
  getAllSettings(): Promise<SiteSetting[]>;
  deleteProduct(id: number): Promise<void>;

  // Message operations
  getMessagesByOrder(orderId: number): Promise<Message[]>;
  getMessagesByUser(userId: string): Promise<Message[]>;
  getUnreadMessages(): Promise<Message[]>;
  createMessage(message: Partial<Message>): Promise<Message>;
  markMessageRead(id: number): Promise<void>;

  // Settings operations
  getSetting(key: string): Promise<SiteSetting | undefined>;
  setSetting(key: string, value: any): Promise<SiteSetting>;

  // Deal operations
  getAllDeals(): Promise<Deal[]>;
  getActiveDeals(): Promise<Deal[]>;
  getHomepageDeals(): Promise<Deal[]>;
  getDealById(id: number): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, updates: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: number): Promise<void>;

  // Product template operations
  getProductTemplates(productId: number): Promise<ProductTemplate[]>;
  getActiveProductTemplates(productId: number): Promise<ProductTemplate[]>;
  getProductTemplateById(id: number): Promise<ProductTemplate | undefined>;
  createProductTemplate(template: InsertProductTemplate): Promise<ProductTemplate>;
  updateProductTemplate(id: number, updates: Partial<InsertProductTemplate>): Promise<ProductTemplate | undefined>;
  deleteProductTemplate(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.displayOrder));
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  // Product operations
  async getProducts(filters?: { categoryId?: number; isActive?: boolean; isFeatured?: boolean }): Promise<Product[]> {
    let query = db.select().from(products).$dynamic();
    
    const conditions = [];
    if (filters?.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
    if (filters?.isActive !== undefined) conditions.push(eq(products.isActive, filters.isActive));
    if (filters?.isFeatured !== undefined) conditions.push(eq(products.isFeatured, filters.isFeatured));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(asc(products.name));
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set({ ...product, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    return updated;
  }

  // Product options
  async getProductOptions(productId: number): Promise<ProductOption[]> {
    return db.select().from(productOptions).where(eq(productOptions.productId, productId)).orderBy(asc(productOptions.displayOrder));
  }

  async createProductOption(option: InsertProductOption): Promise<ProductOption> {
    const [created] = await db.insert(productOptions).values(option).returning();
    return created;
  }

  // Pricing tiers
  async getPricingTiers(productId: number): Promise<PricingTier[]> {
    return db.select().from(pricingTiers).where(eq(pricingTiers.productId, productId)).orderBy(asc(pricingTiers.minQuantity));
  }

  // Design operations
  async getDesignsByUser(userId: string): Promise<Design[]> {
    return db.select().from(designs).where(eq(designs.userId, userId)).orderBy(desc(designs.updatedAt));
  }

  async getDesignById(id: number): Promise<Design | undefined> {
    const [design] = await db.select().from(designs).where(eq(designs.id, id));
    return design;
  }

  async createDesign(design: InsertDesign): Promise<Design> {
    const [created] = await db.insert(designs).values(design).returning();
    return created;
  }

  async updateDesign(id: number, design: Partial<InsertDesign>): Promise<Design | undefined> {
    const [updated] = await db.update(designs).set({ ...design, updatedAt: new Date() }).where(eq(designs.id, id)).returning();
    return updated;
  }

  // Cart operations
  async getCartByUserId(userId: string): Promise<Cart | undefined> {
    const [cart] = await db.select().from(carts).where(eq(carts.userId, userId));
    return cart;
  }

  async getCartBySessionId(sessionId: string): Promise<Cart | undefined> {
    const [cart] = await db.select().from(carts).where(eq(carts.sessionId, sessionId));
    return cart;
  }

  async createCart(userId?: string, sessionId?: string): Promise<Cart> {
    const [cart] = await db.insert(carts).values({ userId, sessionId }).returning();
    return cart;
  }

  async getCartItems(cartId: number): Promise<CartItem[]> {
    return db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
  }

  async addCartItem(cartId: number, item: Partial<CartItem>): Promise<CartItem> {
    const [created] = await db.insert(cartItems).values({ ...item, cartId } as any).returning();
    return created;
  }

  async updateCartItem(id: number, updates: Partial<CartItem>): Promise<CartItem | undefined> {
    const [updated] = await db.update(cartItems).set(updates).where(eq(cartItems.id, id)).returning();
    return updated;
  }

  async removeCartItem(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(cartId: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  // Order operations
  async getOrdersByUser(userId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ ...updates, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: Partial<OrderItem>): Promise<OrderItem> {
    const [created] = await db.insert(orderItems).values(item as any).returning();
    return created;
  }

  // Promotion operations
  async getPromotionByCode(code: string): Promise<Promotion | undefined> {
    const [promo] = await db.select().from(promotions).where(eq(promotions.code, code.toUpperCase()));
    return promo;
  }

  async validatePromotion(code: string, orderAmount: number): Promise<{ valid: boolean; discount?: number; message?: string }> {
    const promo = await this.getPromotionByCode(code);
    if (!promo) return { valid: false, message: "Invalid promo code" };
    if (!promo.isActive) return { valid: false, message: "This promo code is no longer active" };
    if (promo.expiresAt && promo.expiresAt < new Date()) return { valid: false, message: "This promo code has expired" };
    if (promo.maxUses && promo.usesCount && promo.usesCount >= promo.maxUses) return { valid: false, message: "This promo code has reached its usage limit" };
    if (promo.minOrderAmount && parseFloat(promo.minOrderAmount) > orderAmount) {
      return { valid: false, message: `Minimum order amount of $${promo.minOrderAmount} required` };
    }

    let discount = 0;
    if (promo.discountType === "percentage") {
      discount = orderAmount * (parseFloat(promo.discountValue) / 100);
    } else {
      discount = parseFloat(promo.discountValue);
    }

    return { valid: true, discount };
  }

  // Message operations
  async getMessagesByOrder(orderId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.orderId, orderId)).orderBy(asc(messages.createdAt));
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.userId, userId)).orderBy(asc(messages.createdAt));
  }

  async getUnreadMessages(): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.isRead, false)).orderBy(desc(messages.createdAt));
  }

  async createMessage(message: Partial<Message>): Promise<Message> {
    const [created] = await db.insert(messages).values(message as any).returning();
    return created;
  }

  async markMessageRead(id: number): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
  }

  // Settings operations
  async getSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async setSetting(key: string, value: any): Promise<SiteSetting> {
    const [setting] = await db
      .insert(siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return setting;
  }

  async getAllSettings(): Promise<SiteSetting[]> {
    return db.select().from(siteSettings).orderBy(asc(siteSettings.key));
  }

  async getAllPromotions(): Promise<Promotion[]> {
    return db.select().from(promotions).orderBy(desc(promotions.createdAt));
  }

  async getPromotionById(id: number): Promise<Promotion | undefined> {
    const [promo] = await db.select().from(promotions).where(eq(promotions.id, id));
    return promo;
  }

  async createPromotion(promo: Partial<Promotion>): Promise<Promotion> {
    const [created] = await db.insert(promotions).values(promo as any).returning();
    return created;
  }

  async updatePromotion(id: number, updates: Partial<Promotion>): Promise<Promotion | undefined> {
    const [updated] = await db.update(promotions).set(updates).where(eq(promotions.id, id)).returning();
    return updated;
  }

  async deletePromotion(id: number): Promise<void> {
    await db.delete(promotions).where(eq(promotions.id, id));
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getAdminStats(): Promise<{ orderCount: number; revenue: number; productCount: number; userCount: number }> {
    const [orderStats] = await db.select({
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`COALESCE(sum(${orders.totalAmount}::numeric), 0)::float`
    }).from(orders);
    
    const [productStats] = await db.select({
      count: sql<number>`count(*)::int`
    }).from(products);
    
    const [userStats] = await db.select({
      count: sql<number>`count(*)::int`
    }).from(users);

    return {
      orderCount: orderStats?.count || 0,
      revenue: orderStats?.revenue || 0,
      productCount: productStats?.count || 0,
      userCount: userStats?.count || 0
    };
  }

  async getUsersWithOrderStats(): Promise<Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    isAdmin: boolean;
    createdAt: Date;
    hasOrders: boolean;
    orderCount: number;
    totalSpent: number;
  }>> {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    
    const usersWithStats = await Promise.all(allUsers.map(async (user) => {
      const [orderStats] = await db.select({
        count: sql<number>`count(*)::int`,
        total: sql<number>`COALESCE(sum(${orders.totalAmount}::numeric), 0)::float`
      }).from(orders).where(eq(orders.userId, user.id));
      
      return {
        id: user.id,
        email: user.email || '',
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin || false,
        createdAt: user.createdAt || new Date(),
        hasOrders: (orderStats?.count || 0) > 0,
        orderCount: orderStats?.count || 0,
        totalSpent: orderStats?.total || 0
      };
    }));
    
    return usersWithStats;
  }

  async getFinanceOverview(): Promise<{
    totalRevenue: number;
    orderCount: number;
    averageOrderValue: number;
    recentOrders: Array<{
      id: number;
      total: number;
      status: string;
      createdAt: Date;
      customerEmail: string;
    }>;
    revenueByStatus: {
      paid: number;
      pending: number;
      delivered: number;
      cancelled: number;
    };
  }> {
    const [totals] = await db.select({
      totalRevenue: sql<number>`COALESCE(sum(${orders.totalAmount}::numeric), 0)::float`,
      orderCount: sql<number>`count(*)::int`
    }).from(orders);

    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10);
    
    const recentOrders = await Promise.all(allOrders.map(async (order) => {
      const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, order.userId || '')).limit(1);
      return {
        id: order.id,
        total: Number(order.totalAmount) || 0,
        status: order.status || 'pending',
        createdAt: order.createdAt || new Date(),
        customerEmail: user?.email || 'Guest'
      };
    }));

    const statusTotals = await db.select({
      status: orders.status,
      total: sql<number>`COALESCE(sum(${orders.totalAmount}::numeric), 0)::float`
    }).from(orders).groupBy(orders.status);

    const revenueByStatus = {
      paid: 0,
      pending: 0,
      delivered: 0,
      cancelled: 0
    };

    statusTotals.forEach(row => {
      const status = row.status || 'pending';
      if (status === 'paid') revenueByStatus.paid = row.total || 0;
      else if (status === 'pending') revenueByStatus.pending = row.total || 0;
      else if (status === 'delivered') revenueByStatus.delivered = row.total || 0;
      else if (status === 'cancelled') revenueByStatus.cancelled = row.total || 0;
    });

    const avgOrderValue = (totals?.orderCount || 0) > 0 
      ? (totals?.totalRevenue || 0) / (totals?.orderCount || 1)
      : 0;

    return {
      totalRevenue: totals?.totalRevenue || 0,
      orderCount: totals?.orderCount || 0,
      averageOrderValue: avgOrderValue,
      recentOrders,
      revenueByStatus
    };
  }

  // Deal operations
  async getAllDeals(): Promise<Deal[]> {
    return db.select().from(deals).orderBy(asc(deals.displayOrder), desc(deals.createdAt));
  }

  async getActiveDeals(): Promise<Deal[]> {
    const now = new Date();
    return db.select().from(deals)
      .where(
        and(
          eq(deals.isActive, true),
          or(
            sql`${deals.startsAt} IS NULL`,
            lte(deals.startsAt, now)
          ),
          or(
            sql`${deals.endsAt} IS NULL`,
            gte(deals.endsAt, now)
          )
        )
      )
      .orderBy(asc(deals.displayOrder), desc(deals.createdAt));
  }

  async getHomepageDeals(): Promise<Deal[]> {
    const now = new Date();
    return db.select().from(deals)
      .where(
        and(
          eq(deals.isActive, true),
          eq(deals.showOnHomepage, true),
          or(
            sql`${deals.startsAt} IS NULL`,
            lte(deals.startsAt, now)
          ),
          or(
            sql`${deals.endsAt} IS NULL`,
            gte(deals.endsAt, now)
          )
        )
      )
      .orderBy(asc(deals.displayOrder))
      .limit(6);
  }

  async getDealById(id: number): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal;
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [created] = await db.insert(deals).values(deal).returning();
    return created;
  }

  async updateDeal(id: number, updates: Partial<InsertDeal>): Promise<Deal | undefined> {
    const [updated] = await db.update(deals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return updated;
  }

  async deleteDeal(id: number): Promise<void> {
    await db.delete(deals).where(eq(deals.id, id));
  }

  // Product template operations
  async getProductTemplates(productId: number): Promise<ProductTemplate[]> {
    return db.select().from(productTemplates)
      .where(eq(productTemplates.productId, productId))
      .orderBy(asc(productTemplates.displayOrder));
  }

  async getActiveProductTemplates(productId: number): Promise<ProductTemplate[]> {
    return db.select().from(productTemplates)
      .where(and(
        eq(productTemplates.productId, productId),
        eq(productTemplates.isActive, true)
      ))
      .orderBy(asc(productTemplates.displayOrder));
  }

  async getProductTemplateById(id: number): Promise<ProductTemplate | undefined> {
    const [template] = await db.select().from(productTemplates).where(eq(productTemplates.id, id));
    return template;
  }

  async createProductTemplate(template: InsertProductTemplate): Promise<ProductTemplate> {
    const [created] = await db.insert(productTemplates).values(template).returning();
    return created;
  }

  async updateProductTemplate(id: number, updates: Partial<InsertProductTemplate>): Promise<ProductTemplate | undefined> {
    const [updated] = await db.update(productTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(productTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteProductTemplate(id: number): Promise<void> {
    await db.delete(productTemplates).where(eq(productTemplates.id, id));
  }
}

export const storage = new DatabaseStorage();
