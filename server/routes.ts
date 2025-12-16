import type { Express, Request, Response, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, adminInvitations } from "@shared/schema";
import { eq, and, not, isNull } from "drizzle-orm";
import Stripe from "stripe";
import PDFDocument from "pdfkit";
import multer from "multer";
import express from "express";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const AI_SYSTEM_PROMPT = `You are a friendly and helpful customer support assistant for Sticky Banditos, a custom printing company. 

About Sticky Banditos:
- We specialize in custom stickers, business cards, flyers, postcards, brochures, and posters
- All products are printed with premium quality materials
- Standard shipping is $15 flat rate
- Typical turnaround time is 3-5 business days for production, plus shipping time
- We offer gloss, matte, clear, and holographic vinyl for stickers
- Business cards come in various weights: 14pt, 16pt, and 18pt cardstock
- We support custom die-cut shapes for stickers
- Users can upload their own artwork or design using our online editor

Pricing highlights:
- Stickers: Starting at $0.12/each for 1000+, $0.29/each for 100
- Business Cards: Starting at $0.12/each for 1000+, $0.20/each for 100
- Flyers (8.5x11): Starting at $0.16/each for 1000+, $0.65/each for 100
- Volume discounts are available - the more you order, the more you save!

DESIGN EDITOR HELP:
If users ask about how to use the editor, provide these tips:
1. Getting Started: Select a product, choose your options (size, material, quantity), then click "Start Designing" to open the editor
2. Canvas Layout: The canvas shows your design area with visual guides:
   - GREEN dashed line = Safe Zone (keep important content inside this)
   - RED dashed line = Bleed Area (extend backgrounds to this edge to avoid white edges when trimmed)
3. Toolbar Tools (on the left side):
   - Text tool: Add custom text, change fonts, colors, and sizes
   - Shapes: Add rectangles, circles, and other shapes
   - Upload: Upload your own images (PNG, JPG, SVG, PDF up to 50MB)
   - Background color: Change the canvas background
4. Best Practices:
   - Use images at least 300 DPI for best print quality
   - Keep all important text and logos inside the green Safe Zone
   - Extend background colors/images to the red Bleed Area
   - Save your work frequently using the Save button
5. When done: Click "Add to Cart" to save your design and add it to your shopping cart
6. File Formats: We accept PNG, JPG, SVG, and PDF files up to 50MB
7. Colors: Printed colors may vary slightly from what you see on screen due to differences between RGB (screen) and CMYK (print)

Keep responses concise, friendly, and helpful. If you don't know something specific about an order, politely ask them to provide their order number so a team member can help. For complex issues, let them know a team member will follow up.

ESCALATION RULES:
If a customer explicitly asks to speak with a real person, human, manager, or expresses frustration that they need human help, respond with EXACTLY this format:
"[ESCALATE] I understand you'd like to speak with a team member directly. I'm connecting you to our support team now. A real person will respond to you shortly - typically within a few hours during business hours. Is there anything specific you'd like me to note for them?"

Only use [ESCALATE] when the customer clearly asks for a human. Do not escalate for normal questions you can answer.`;

interface AIResponseResult {
  response: string;
  shouldEscalate: boolean;
}

async function generateAIResponse(userMessage: string): Promise<AIResponseResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: AI_SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      max_completion_tokens: 500,
    });
    const content = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again or wait for a team member to assist you.";
    
    const shouldEscalate = content.includes("[ESCALATE]");
    const cleanResponse = content.replace("[ESCALATE]", "").trim();
    
    return { response: cleanResponse, shouldEscalate };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads', 'artwork');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const productImagesDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(productImagesDir)) {
  fs.mkdirSync(productImagesDir, { recursive: true });
}

const templatesDir = path.join(process.cwd(), 'uploads', 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

const productImageUpload = multer({
  storage: productImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for product images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPG, PNG, GIF, WebP'));
    }
  }
});

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

const templateImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, templatesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `template-${uniqueSuffix}${ext}`);
  }
});

const templateImageUpload = multer({
  storage: templateImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for template preview images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPG, PNG, GIF, WebP'));
    }
  }
});

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Serve attached_assets statically for product images
  const attachedAssetsPath = path.join(process.cwd(), 'attached_assets');
  app.use('/attached_assets', express.static(attachedAssetsPath));

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
      const userId = req.user.id;
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
      const userId = req.user.id;
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

  // Product image uploads (admin only)
  app.post("/api/admin/upload/product-image", isAdmin, productImageUpload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = `/uploads/products/${req.file.filename}`;
      
      res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      console.error("Error uploading product image:", error);
      res.status(500).json({ message: "Failed to upload product image" });
    }
  });

  // Serve uploaded product images
  app.get("/uploads/products/:filename", (req, res) => {
    const filepath = path.join(process.cwd(), 'uploads', 'products', req.params.filename);
    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  // Template preview image uploads (admin only)
  app.post("/api/admin/upload/template-image", isAdmin, templateImageUpload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = `/uploads/templates/${req.file.filename}`;
      
      res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      console.error("Error uploading template image:", error);
      res.status(500).json({ message: "Failed to upload template image" });
    }
  });

  // Serve uploaded template images
  app.get("/uploads/templates/:filename", (req, res) => {
    const filepath = path.join(process.cwd(), 'uploads', 'templates', req.params.filename);
    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  // Serve uploaded deal images
  app.get("/uploads/deals/:filename", (req, res) => {
    const filepath = path.join(process.cwd(), 'uploads', 'deals', req.params.filename);
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

      const userId = req.user.id;
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

      // Arizona sales tax rate (Phoenix: state 5.6% + county 0.7% + city 2.3% = 8.6%)
      // Tax applies to subtotal after discounts (taxable amount = subtotal - discount)
      const TAX_RATE = 0.086;
      const taxableAmount = Math.max(0, subtotal - discountAmount);
      const taxAmount = taxableAmount * TAX_RATE;
      const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

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
        taxAmount,
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
      const userId = req.user.id;
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
      
      // Enrich items with design and product data for customer viewing
      const enrichedItems = await Promise.all(items.map(async (item) => {
        let design = null;
        let product = null;
        
        if (item.designId) {
          design = await storage.getDesignById(item.designId);
        }
        if (item.productId) {
          product = await storage.getProductById(item.productId);
        }
        
        return { ...item, design, product };
      }));
      
      res.json({ ...order, items: enrichedItems });
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
      const userId = req.user.id;
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

  // Admin Users endpoint - returns all users with order statistics
  app.get("/api/admin/users", isAdmin, async (req: any, res) => {
    try {
      const usersWithStats = await storage.getUsersWithOrderStats();
      res.json(usersWithStats);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin Finances endpoint - returns financial overview
  app.get("/api/admin/finances", isAdmin, async (req: any, res) => {
    try {
      const financeData = await storage.getFinanceOverview();
      res.json(financeData);
    } catch (error) {
      console.error("Error fetching finance data:", error);
      res.status(500).json({ message: "Failed to fetch finance data" });
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

  // Product Template Routes (Admin)
  app.get("/api/admin/products/:productId/templates", isAdmin, async (req: any, res) => {
    try {
      const templates = await storage.getProductTemplates(parseInt(req.params.productId));
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post("/api/admin/products/:productId/templates", isAdmin, async (req: any, res) => {
    try {
      const template = await storage.createProductTemplate({
        ...req.body,
        productId: parseInt(req.params.productId),
      });
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put("/api/admin/templates/:id", isAdmin, async (req: any, res) => {
    try {
      const template = await storage.updateProductTemplate(parseInt(req.params.id), req.body);
      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/admin/templates/:id", isAdmin, async (req: any, res) => {
    try {
      await storage.deleteProductTemplate(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Public: Get active templates for a product (for customers in editor)
  app.get("/api/products/:productId/templates", async (req, res) => {
    try {
      const templates = await storage.getActiveProductTemplates(parseInt(req.params.productId));
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/admin/orders/:id", isAdmin, async (req: any, res) => {
    try {
      const order = await storage.getOrderById(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const items = await storage.getOrderItems(order.id);
      
      // Enrich items with design and product data for admin viewing
      const enrichedItems = await Promise.all(items.map(async (item) => {
        let design = null;
        let product = null;
        
        if (item.designId) {
          design = await storage.getDesignById(item.designId);
        }
        if (item.productId) {
          product = await storage.getProductById(item.productId);
        }
        
        return { ...item, design, product };
      }));
      
      res.json({ ...order, items: enrichedItems });
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

  // Public: Get active deals
  app.get("/api/deals", async (req, res) => {
    try {
      const deals = await storage.getActiveDeals();
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  // Public: Get homepage deals
  app.get("/api/deals/homepage", async (req, res) => {
    try {
      const deals = await storage.getHomepageDeals();
      res.json(deals);
    } catch (error) {
      console.error("Error fetching homepage deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  // Admin: Get all deals
  app.get("/api/admin/deals", isAdmin, async (req: any, res) => {
    try {
      const deals = await storage.getAllDeals();
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  // Admin: Create deal
  app.post("/api/admin/deals", isAdmin, async (req: any, res) => {
    try {
      const deal = await storage.createDeal(req.body);
      res.json(deal);
    } catch (error) {
      console.error("Error creating deal:", error);
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  // Admin: Update deal
  app.put("/api/admin/deals/:id", isAdmin, async (req: any, res) => {
    try {
      const deal = await storage.updateDeal(parseInt(req.params.id), req.body);
      res.json(deal);
    } catch (error) {
      console.error("Error updating deal:", error);
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  // Admin: Delete deal
  app.delete("/api/admin/deals/:id", isAdmin, async (req: any, res) => {
    try {
      await storage.deleteDeal(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting deal:", error);
      res.status(500).json({ message: "Failed to delete deal" });
    }
  });

  // Chat/Support messages
  app.get("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const messages = await storage.getMessagesByUser(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { content, orderId } = req.body;

      if (!content || content.trim() === '') {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Ensure user exists in database (should already exist from login)
      const user = await storage.getUser(userId);

      const userMessage = await storage.createMessage({
        userId,
        orderId: orderId || null,
        senderType: "user",
        content: content.trim(),
        isRead: false,
        isFromHuman: true,
        needsHumanSupport: false,
      });

      // Generate AI response
      try {
        const { response: aiResponse, shouldEscalate } = await generateAIResponse(content.trim());
        
        await storage.createMessage({
          userId,
          orderId: orderId || null,
          senderType: "admin",
          content: aiResponse,
          isRead: false,
          isFromHuman: false,
          needsHumanSupport: shouldEscalate,
          escalatedAt: shouldEscalate ? new Date() : null,
        });

        // If escalated, mark all user messages for this user as needing human support
        if (shouldEscalate) {
          await storage.escalateConversation(userId);
        }
      } catch (aiError) {
        console.error("AI response error:", aiError);
        // Don't fail the request if AI fails - user message was still saved
      }

      res.json(userMessage);
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

  // Admin: Reply to a message (human admin responding)
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
        isFromHuman: true,
        needsHumanSupport: false,
      });

      // Mark conversation as handled (no longer needs human support)
      await storage.resolveConversation(userId);

      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Admin Inbox: Get all escalated conversations needing human support
  app.get("/api/admin/inbox", isAdmin, async (req: any, res) => {
    try {
      const conversations = await storage.getEscalatedConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching inbox:", error);
      res.status(500).json({ message: "Failed to fetch inbox" });
    }
  });

  // Admin Inbox: Get conversation history for a specific user
  app.get("/api/admin/inbox/:userId", isAdmin, async (req: any, res) => {
    try {
      const messages = await storage.getMessagesByUser(req.params.userId);
      const user = await storage.getUser(req.params.userId);
      res.json({ messages: messages || [], user: user || null });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
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

  // ==================== ADMIN MANAGEMENT ROUTES ====================

  // Get all admins
  app.get("/api/admin/admins", isAdmin, async (req: any, res) => {
    try {
      const admins = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.isAdmin, true));
      res.json(admins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ message: "Failed to fetch admins" });
    }
  });

  // Get pending admin invitations
  app.get("/api/admin/invitations", isAdmin, async (req: any, res) => {
    try {
      const invitations = await db
        .select()
        .from(adminInvitations)
        .where(eq(adminInvitations.status, "pending"));
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  // Invite new admin
  app.post("/api/admin/admins/invite", isAdmin, async (req: any, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const normalizedEmail = email.toLowerCase();
      const inviterId = req.user.id;

      // Check if user already exists as admin
      const [existingUser] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, normalizedEmail), eq(users.isAdmin, true)))
        .limit(1);

      if (existingUser) {
        return res.status(400).json({ message: "This user is already an admin" });
      }

      // Check if invitation already exists
      const [existingInvite] = await db
        .select()
        .from(adminInvitations)
        .where(eq(adminInvitations.email, normalizedEmail))
        .limit(1);

      if (existingInvite && existingInvite.status === "pending") {
        return res.status(400).json({ message: "Invitation already sent to this email" });
      }

      // Generate invitation token
      const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Create or update invitation
      if (existingInvite) {
        await db
          .update(adminInvitations)
          .set({
            status: "pending",
            invitationToken,
            invitedBy: inviterId,
            createdAt: new Date(),
            revokedAt: null,
          })
          .where(eq(adminInvitations.email, normalizedEmail));
      } else {
        await db.insert(adminInvitations).values({
          email: normalizedEmail,
          invitedBy: inviterId,
          invitationToken,
          status: "pending",
        });
      }

      // If user already exists, make them admin immediately
      const [existingNonAdmin] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existingNonAdmin) {
        await db
          .update(users)
          .set({ isAdmin: true })
          .where(eq(users.id, existingNonAdmin.id));

        await db
          .update(adminInvitations)
          .set({ status: "accepted", acceptedAt: new Date() })
          .where(eq(adminInvitations.email, normalizedEmail));

        return res.json({ message: "User has been promoted to admin", status: "accepted" });
      }

      res.json({ message: "Invitation sent successfully", status: "pending" });
    } catch (error) {
      console.error("Error inviting admin:", error);
      res.status(500).json({ message: "Failed to invite admin" });
    }
  });

  // Revoke admin access
  app.delete("/api/admin/admins/:userId", isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id;

      if (userId === currentUserId) {
        return res.status(400).json({ message: "You cannot remove yourself as admin" });
      }

      // Remove admin status
      await db
        .update(users)
        .set({ isAdmin: false })
        .where(eq(users.id, userId));

      // Update invitation status if exists
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user?.email) {
        await db
          .update(adminInvitations)
          .set({ status: "revoked", revokedAt: new Date() })
          .where(eq(adminInvitations.email, user.email));
      }

      res.json({ message: "Admin access revoked successfully" });
    } catch (error) {
      console.error("Error revoking admin:", error);
      res.status(500).json({ message: "Failed to revoke admin access" });
    }
  });

  // Seed initial admin on first request (if no admins exist)
  app.get("/api/admin/seed-check", async (req, res) => {
    try {
      const [existingAdmin] = await db
        .select()
        .from(users)
        .where(eq(users.isAdmin, true))
        .limit(1);
      
      res.json({ hasAdmin: !!existingAdmin });
    } catch (error) {
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
