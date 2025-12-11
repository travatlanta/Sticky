import type { Express, Request, Response, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import Stripe from "stripe";
import PDFDocument from "pdfkit";
import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads', 'artwork');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const artworkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `artwork-${uniqueSuffix}${ext}`);
  }
});

const artworkUpload = multer({
  storage: artworkStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPG, PNG, GIF, WebP, SVG, PDF'));
    }
  }
});

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const isAdmin: RequestHandler = async (req: any, res, next) => {
  if (!req.isAuthenticated() || !req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, featured } = req.query;
      const filters: any = { isActive: true };
      if (categoryId) filters.categoryId = parseInt(categoryId as string);
      if (featured === "true") filters.isFeatured = true;
      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:slug", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const options = await storage.getProductOptions(product.id);
      const pricingTiers = await storage.getPricingTiers(product.id);

      res.json({ ...product, options, pricingTiers });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Calculate price endpoint
  app.post("/api/products/:id/calculate-price", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { quantity, selectedOptions } = req.body;

      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const pricingTiers = await storage.getPricingTiers(productId);
      const options = await storage.getProductOptions(productId);

      // Find applicable pricing tier
      let pricePerUnit = parseFloat(product.basePrice);
      for (const tier of pricingTiers) {
        if (quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity)) {
          pricePerUnit = parseFloat(tier.pricePerUnit);
          break;
        }
      }

      // Add option modifiers
      let optionsCost = 0;
      if (selectedOptions) {
        for (const optionId of Object.values(selectedOptions)) {
          const option = options.find((o) => o.id === optionId);
          if (option && option.priceModifier) {
            optionsCost += parseFloat(option.priceModifier);
          }
        }
      }

      const subtotal = (pricePerUnit + optionsCost) * quantity;
      res.json({
        pricePerUnit,
        optionsCost,
        quantity,
        subtotal,
      });
    } catch (error) {
      console.error("Error calculating price:", error);
      res.status(500).json({ message: "Failed to calculate price" });
    }
  });

  // Designs
  app.get("/api/designs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const designs = await storage.getDesignsByUser(userId);
      res.json(designs);
    } catch (error) {
      console.error("Error fetching designs:", error);
      res.status(500).json({ message: "Failed to fetch designs" });
    }
  });

  app.get("/api/designs/:id", async (req, res) => {
    try {
      const design = await storage.getDesignById(parseInt(req.params.id));
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      res.json(design);
    } catch (error) {
      console.error("Error fetching design:", error);
      res.status(500).json({ message: "Failed to fetch design" });
    }
  });

  app.post("/api/designs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const design = await storage.createDesign({
        userId,
        ...req.body,
      });
      res.json(design);
    } catch (error) {
      console.error("Error creating design:", error);
      res.status(500).json({ message: "Failed to create design" });
    }
  });

  app.put("/api/designs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const design = await storage.updateDesign(parseInt(req.params.id), req.body);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      res.json(design);
    } catch (error) {
      console.error("Error updating design:", error);
      res.status(500).json({ message: "Failed to update design" });
    }
  });

  // Auto-save design
  app.post("/api/designs/:id/autosave", isAuthenticated, async (req: any, res) => {
    try {
      const design = await storage.updateDesign(parseInt(req.params.id), {
        canvasJson: req.body.canvasJson,
        lastAutoSave: new Date(),
      });
      res.json({ success: true, lastAutoSave: design?.lastAutoSave });
    } catch (error) {
      console.error("Error auto-saving design:", error);
      res.status(500).json({ message: "Failed to auto-save" });
    }
  });

  // PDF Generation for print-ready files - streams PDF directly to client
  app.get("/api/designs/:id/pdf", async (req, res) => {
    try {
      const designId = parseInt(req.params.id);
      const design = await storage.getDesignById(designId);
      
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      const product = design.productId 
        ? await storage.getProductById(design.productId)
        : null;

      const bleedInches = product?.bleedSize ? parseFloat(product.bleedSize) : 0.125;
      const bleedPoints = bleedInches * 72;
      const cropMarkLength = 0.25 * 72;
      const cropMarkOffset = 0.125 * 72;

      const screenWidth = product?.templateWidth || 400;
      const screenHeight = product?.templateHeight || 400;

      const printDPI = 300;
      const screenDPI = 72;

      const printWidthInches = screenWidth / screenDPI;
      const printHeightInches = screenHeight / screenDPI;
      const printWidthPoints = printWidthInches * 72;
      const printHeightPoints = printHeightInches * 72;

      const totalWidth = printWidthPoints + (bleedPoints * 2) + (cropMarkOffset * 2) + (cropMarkLength * 2);
      const totalHeight = printHeightPoints + (bleedPoints * 2) + (cropMarkOffset * 2) + (cropMarkLength * 2);

      const filename = `design_${designId}_${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const doc = new PDFDocument({
        size: [totalWidth, totalHeight],
        margin: 0,
        info: {
          Title: design.name || `Design ${designId}`,
          Author: 'Sticky Banditos',
          Subject: 'Print-Ready Design',
          Creator: 'Sticky Banditos PDF Generator',
        }
      });

      doc.pipe(res);

      const contentX = cropMarkLength + cropMarkOffset + bleedPoints;
      const contentY = cropMarkLength + cropMarkOffset + bleedPoints;

      doc.rect(
        cropMarkLength + cropMarkOffset,
        cropMarkLength + cropMarkOffset,
        printWidthPoints + (bleedPoints * 2),
        printHeightPoints + (bleedPoints * 2)
      ).fill('#ffffff');

      doc.strokeColor('#000000').lineWidth(0.5);

      doc.moveTo(0, cropMarkLength + cropMarkOffset + bleedPoints)
         .lineTo(cropMarkLength, cropMarkLength + cropMarkOffset + bleedPoints)
         .stroke();
      doc.moveTo(cropMarkLength + cropMarkOffset + bleedPoints, 0)
         .lineTo(cropMarkLength + cropMarkOffset + bleedPoints, cropMarkLength)
         .stroke();

      doc.moveTo(totalWidth - cropMarkLength, cropMarkLength + cropMarkOffset + bleedPoints)
         .lineTo(totalWidth, cropMarkLength + cropMarkOffset + bleedPoints)
         .stroke();
      doc.moveTo(totalWidth - cropMarkLength - cropMarkOffset - bleedPoints, 0)
         .lineTo(totalWidth - cropMarkLength - cropMarkOffset - bleedPoints, cropMarkLength)
         .stroke();

      doc.moveTo(0, totalHeight - cropMarkLength - cropMarkOffset - bleedPoints)
         .lineTo(cropMarkLength, totalHeight - cropMarkLength - cropMarkOffset - bleedPoints)
         .stroke();
      doc.moveTo(cropMarkLength + cropMarkOffset + bleedPoints, totalHeight - cropMarkLength)
         .lineTo(cropMarkLength + cropMarkOffset + bleedPoints, totalHeight)
         .stroke();

      doc.moveTo(totalWidth - cropMarkLength, totalHeight - cropMarkLength - cropMarkOffset - bleedPoints)
         .lineTo(totalWidth, totalHeight - cropMarkLength - cropMarkOffset - bleedPoints)
         .stroke();
      doc.moveTo(totalWidth - cropMarkLength - cropMarkOffset - bleedPoints, totalHeight - cropMarkLength)
         .lineTo(totalWidth - cropMarkLength - cropMarkOffset - bleedPoints, totalHeight)
         .stroke();

      doc.strokeColor('#00ff00').lineWidth(0.25).dash(3, { space: 3 });
      const safeZoneMargin = bleedPoints;
      doc.rect(
        contentX + safeZoneMargin,
        contentY + safeZoneMargin,
        printWidthPoints - (safeZoneMargin * 2),
        printHeightPoints - (safeZoneMargin * 2)
      ).stroke();

      doc.strokeColor('#ff0000').lineWidth(0.5).undash();
      doc.rect(contentX, contentY, printWidthPoints, printHeightPoints).stroke();

      if (design.canvasJson && typeof design.canvasJson === 'object') {
        const canvasData = design.canvasJson as any;
        const objects = canvasData.objects || [];
        
        for (const obj of objects) {
          if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
            const scaleX = printWidthPoints / screenWidth;
            const scaleY = printHeightPoints / screenHeight;
            const x = contentX + (obj.left || 0) * scaleX;
            const y = contentY + (obj.top || 0) * scaleY;
            const fontSize = (obj.fontSize || 24) * scaleX * (obj.scaleX || 1);
            
            doc.fillColor(obj.fill || '#000000')
               .fontSize(fontSize)
               .text(obj.text || '', x, y, { 
                 lineBreak: false,
                 width: printWidthPoints 
               });
          } else if (obj.type === 'rect') {
            const scaleX = printWidthPoints / screenWidth;
            const scaleY = printHeightPoints / screenHeight;
            const x = contentX + (obj.left || 0) * scaleX;
            const y = contentY + (obj.top || 0) * scaleY;
            const width = (obj.width || 100) * scaleX * (obj.scaleX || 1);
            const height = (obj.height || 100) * scaleY * (obj.scaleY || 1);
            
            doc.fillColor(obj.fill || '#000000')
               .rect(x, y, width, height)
               .fill();
          } else if (obj.type === 'circle') {
            const scaleX = printWidthPoints / screenWidth;
            const scaleY = printHeightPoints / screenHeight;
            const x = contentX + (obj.left || 0) * scaleX + (obj.radius || 50) * scaleX;
            const y = contentY + (obj.top || 0) * scaleY + (obj.radius || 50) * scaleY;
            const radius = (obj.radius || 50) * scaleX * (obj.scaleX || 1);
            
            doc.fillColor(obj.fill || '#000000')
               .circle(x, y, radius)
               .fill();
          }
        }
      }

      doc.fontSize(8).fillColor('#666666');
      doc.text(`Design ID: ${designId}`, 5, 5);
      doc.text(`Print Ready - ${printWidthInches.toFixed(2)}" x ${printHeightInches.toFixed(2)}" @ 300 DPI`, 5, 15);
      doc.text(`Bleed: ${bleedInches}" | Generated: ${new Date().toISOString()}`, 5, 25);

      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // PDF Generation with image data (POST method for larger canvas exports)
  app.post("/api/designs/:id/pdf", async (req, res) => {
    try {
      const designId = parseInt(req.params.id);
      const { canvasImageData } = req.body;
      
      const design = await storage.getDesignById(designId);
      
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      const product = design.productId 
        ? await storage.getProductById(design.productId)
        : null;

      const bleedInches = product?.bleedSize ? parseFloat(product.bleedSize) : 0.125;
      const bleedPoints = bleedInches * 72;
      const cropMarkLength = 0.25 * 72;
      const cropMarkOffset = 0.125 * 72;

      const screenWidth = product?.templateWidth || 400;
      const screenHeight = product?.templateHeight || 400;

      const printWidthInches = screenWidth / 72;
      const printHeightInches = screenHeight / 72;
      const printWidthPoints = printWidthInches * 72;
      const printHeightPoints = printHeightInches * 72;

      const totalWidth = printWidthPoints + (bleedPoints * 2) + (cropMarkOffset * 2) + (cropMarkLength * 2);
      const totalHeight = printHeightPoints + (bleedPoints * 2) + (cropMarkOffset * 2) + (cropMarkLength * 2);

      const doc = new PDFDocument({
        size: [totalWidth, totalHeight],
        margin: 0,
        info: {
          Title: design.name || `Design ${designId}`,
          Author: 'Sticky Banditos',
          Subject: 'Print-Ready Design',
          Creator: 'Sticky Banditos PDF Generator',
        }
      });

      const pdfDir = path.join(process.cwd(), 'uploads', 'pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const filename = `design_${designId}_${Date.now()}.pdf`;
      const filepath = path.join(pdfDir, filename);
      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);

      const contentX = cropMarkLength + cropMarkOffset + bleedPoints;
      const contentY = cropMarkLength + cropMarkOffset + bleedPoints;

      doc.rect(
        cropMarkLength + cropMarkOffset,
        cropMarkLength + cropMarkOffset,
        printWidthPoints + (bleedPoints * 2),
        printHeightPoints + (bleedPoints * 2)
      ).fill('#ffffff');

      if (canvasImageData) {
        const base64Data = canvasImageData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        doc.image(imageBuffer, contentX, contentY, {
          width: printWidthPoints,
          height: printHeightPoints,
          fit: [printWidthPoints, printHeightPoints],
        });
      }

      doc.strokeColor('#000000').lineWidth(0.5);

      doc.moveTo(0, cropMarkLength + cropMarkOffset + bleedPoints)
         .lineTo(cropMarkLength, cropMarkLength + cropMarkOffset + bleedPoints)
         .stroke();
      doc.moveTo(cropMarkLength + cropMarkOffset + bleedPoints, 0)
         .lineTo(cropMarkLength + cropMarkOffset + bleedPoints, cropMarkLength)
         .stroke();

      doc.moveTo(totalWidth - cropMarkLength, cropMarkLength + cropMarkOffset + bleedPoints)
         .lineTo(totalWidth, cropMarkLength + cropMarkOffset + bleedPoints)
         .stroke();
      doc.moveTo(totalWidth - cropMarkLength - cropMarkOffset - bleedPoints, 0)
         .lineTo(totalWidth - cropMarkLength - cropMarkOffset - bleedPoints, cropMarkLength)
         .stroke();

      doc.moveTo(0, totalHeight - cropMarkLength - cropMarkOffset - bleedPoints)
         .lineTo(cropMarkLength, totalHeight - cropMarkLength - cropMarkOffset - bleedPoints)
         .stroke();
      doc.moveTo(cropMarkLength + cropMarkOffset + bleedPoints, totalHeight - cropMarkLength)
         .lineTo(cropMarkLength + cropMarkOffset + bleedPoints, totalHeight)
         .stroke();

      doc.moveTo(totalWidth - cropMarkLength, totalHeight - cropMarkLength - cropMarkOffset - bleedPoints)
         .lineTo(totalWidth, totalHeight - cropMarkLength - cropMarkOffset - bleedPoints)
         .stroke();
      doc.moveTo(totalWidth - cropMarkLength - cropMarkOffset - bleedPoints, totalHeight - cropMarkLength)
         .lineTo(totalWidth - cropMarkLength - cropMarkOffset - bleedPoints, totalHeight)
         .stroke();

      doc.fontSize(8).fillColor('#666666');
      doc.text(`Design ID: ${designId}`, 5, 5);
      doc.text(`Print Ready - ${printWidthInches.toFixed(2)}" x ${printHeightInches.toFixed(2)}" @ 300 DPI`, 5, 15);

      doc.end();

      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      res.json({
        success: true,
        pdfUrl: `/uploads/pdfs/${filename}`,
        filename,
        specifications: {
          designId,
          printWidth: `${printWidthInches.toFixed(2)} inches`,
          printHeight: `${printHeightInches.toFixed(2)} inches`,
          bleed: `${bleedInches} inches`,
          resolution: '300 DPI',
          totalWithBleed: `${(printWidthInches + bleedInches * 2).toFixed(2)}" x ${(printHeightInches + bleedInches * 2).toFixed(2)}"`,
        }
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Serve generated PDFs
  app.get("/uploads/pdfs/:filename", (req, res) => {
    const filepath = path.join(process.cwd(), 'uploads', 'pdfs', req.params.filename);
    if (fs.existsSync(filepath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
      fs.createReadStream(filepath).pipe(res);
    } else {
      res.status(404).json({ message: "PDF not found" });
    }
  });

  // Artwork file uploads
  app.post("/api/upload/artwork", isAuthenticated, artworkUpload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = `/uploads/artwork/${req.file.filename}`;
      
      res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      console.error("Error uploading artwork:", error);
      res.status(500).json({ message: "Failed to upload artwork" });
    }
  });

  // Serve uploaded artwork files
  app.get("/uploads/artwork/:filename", (req, res) => {
    const filepath = path.join(process.cwd(), 'uploads', 'artwork', req.params.filename);
    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  // Cart
  app.get("/api/cart", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const sessionId = req.sessionID;

      let cart = userId
        ? await storage.getCartByUserId(userId)
        : await storage.getCartBySessionId(sessionId);

      if (!cart) {
        cart = await storage.createCart(userId, sessionId);
      }

      const items = await storage.getCartItems(cart.id);

      // Enrich cart items with product info
      const enrichedItems = await Promise.all(
        items.map(async (item) => {
          const product = await storage.getProductById(item.productId);
          const design = item.designId ? await storage.getDesignById(item.designId) : null;
          return { ...item, product, design };
        })
      );

      res.json({ ...cart, items: enrichedItems });
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart/add", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const sessionId = req.sessionID;

      let cart = userId
        ? await storage.getCartByUserId(userId)
        : await storage.getCartBySessionId(sessionId);

      if (!cart) {
        cart = await storage.createCart(userId, sessionId);
      }

      const item = await storage.addCartItem(cart.id, req.body);
      res.json(item);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.put("/api/cart/items/:id", async (req, res) => {
    try {
      const item = await storage.updateCartItem(parseInt(req.params.id), req.body);
      res.json(item);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/items/:id", async (req, res) => {
    try {
      await storage.removeCartItem(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing cart item:", error);
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  // Promotions
  app.post("/api/promotions/validate", async (req, res) => {
    try {
      const { code, orderAmount } = req.body;
      const result = await storage.validatePromotion(code, orderAmount);
      res.json(result);
    } catch (error) {
      console.error("Error validating promo:", error);
      res.status(500).json({ message: "Failed to validate promo code" });
    }
  });

  // Checkout
  app.post("/api/checkout/create-payment-intent", isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment processing not configured" });
      }

      const userId = req.user.claims.sub;
      const { shippingAddress, billingAddress, promoCode } = req.body;

      const cart = await storage.getCartByUserId(userId);
      if (!cart) {
        return res.status(400).json({ message: "Cart not found" });
      }

      const items = await storage.getCartItems(cart.id);
      if (items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Calculate totals
      let subtotal = 0;
      for (const item of items) {
        subtotal += parseFloat(item.unitPrice || "0") * item.quantity;
      }

      const shippingCost = 15.0;
      let discountAmount = 0;

      if (promoCode) {
        const promoResult = await storage.validatePromotion(promoCode, subtotal);
        if (promoResult.valid && promoResult.discount) {
          discountAmount = promoResult.discount;
        }
      }

      const totalAmount = subtotal + shippingCost - discountAmount;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: "usd",
        metadata: {
          userId,
          cartId: cart.id.toString(),
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        subtotal,
        shippingCost,
        discountAmount,
        totalAmount,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Orders
  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getOrdersByUser(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const order = await storage.getOrderById(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const items = await storage.getOrderItems(order.id);
      res.json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.get("/api/orders/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getMessagesByOrder(parseInt(req.params.id));
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/orders/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const message = await storage.createMessage({
        orderId: parseInt(req.params.id),
        userId,
        senderType: "user",
        content: req.body.content,
      });
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Admin routes
  app.get("/api/admin/orders", isAdmin, async (req: any, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.put("/api/admin/orders/:id", isAdmin, async (req: any, res) => {
    try {
      const order = await storage.updateOrder(parseInt(req.params.id), req.body);
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Settings
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      res.json(setting?.value || null);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  app.put("/api/admin/settings/:key", isAdmin, async (req: any, res) => {
    try {
      const setting = await storage.setSetting(req.params.key, req.body.value);
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  app.get("/api/admin/settings", isAdmin, async (req: any, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get("/api/admin/stats", isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/products", isAdmin, async (req: any, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", isAdmin, async (req: any, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/admin/products/:id", isAdmin, async (req: any, res) => {
    try {
      const product = await storage.updateProduct(parseInt(req.params.id), req.body);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", isAdmin, async (req: any, res) => {
    try {
      await storage.deleteProduct(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.get("/api/admin/orders/:id", isAdmin, async (req: any, res) => {
    try {
      const order = await storage.getOrderById(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const items = await storage.getOrderItems(order.id);
      res.json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.get("/api/admin/promotions", isAdmin, async (req: any, res) => {
    try {
      const promotions = await storage.getAllPromotions();
      res.json(promotions);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  app.post("/api/admin/promotions", isAdmin, async (req: any, res) => {
    try {
      const promotion = await storage.createPromotion(req.body);
      res.json(promotion);
    } catch (error) {
      console.error("Error creating promotion:", error);
      res.status(500).json({ message: "Failed to create promotion" });
    }
  });

  app.put("/api/admin/promotions/:id", isAdmin, async (req: any, res) => {
    try {
      const promotion = await storage.updatePromotion(parseInt(req.params.id), req.body);
      res.json(promotion);
    } catch (error) {
      console.error("Error updating promotion:", error);
      res.status(500).json({ message: "Failed to update promotion" });
    }
  });

  app.delete("/api/admin/promotions/:id", isAdmin, async (req: any, res) => {
    try {
      await storage.deletePromotion(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting promotion:", error);
      res.status(500).json({ message: "Failed to delete promotion" });
    }
  });

  // Chat/Support messages
  app.get("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getMessagesByUser(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content, orderId } = req.body;

      if (!content || content.trim() === '') {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Ensure user exists in database (upsert if needed)
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email: req.user.claims.email,
          firstName: req.user.claims.first_name,
          lastName: req.user.claims.last_name,
          profileImageUrl: req.user.claims.profile_image_url,
        });
      }

      const message = await storage.createMessage({
        userId,
        orderId: orderId || null,
        senderType: "user",
        content: content.trim(),
        isRead: false,
      });

      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Admin: Get all unread messages
  app.get("/api/admin/messages", isAdmin, async (req: any, res) => {
    try {
      const messages = await storage.getUnreadMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Admin: Reply to a message
  app.post("/api/admin/messages/reply", isAdmin, async (req: any, res) => {
    try {
      const { userId, content, orderId } = req.body;

      if (!content || content.trim() === '') {
        return res.status(400).json({ message: "Message content is required" });
      }

      const message = await storage.createMessage({
        userId,
        orderId: orderId || null,
        senderType: "admin",
        content: content.trim(),
        isRead: false,
      });

      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Mark message as read
  app.put("/api/messages/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      await storage.markMessageRead(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
