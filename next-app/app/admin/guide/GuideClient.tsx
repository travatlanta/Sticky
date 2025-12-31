"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { 
  Search, 
  Phone, 
  ChevronRight,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Flame,
  Users,
  DollarSign,
  Paintbrush,
  BarChart3,
  Settings,
  Inbox,
  Globe,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Section {
  id: string;
  title: string;
  icon: any;
  keywords: string[];
  content: JSX.Element;
}

const sections: Section[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    keywords: ["dashboard", "home", "overview", "stats", "statistics", "orders", "revenue", "products", "users", "quick actions"],
    content: (
      <div className="space-y-4">
        <p>The Dashboard is your home base when you log into the admin panel. It gives you a quick snapshot of how your store is doing.</p>
        
        <h4 className="font-semibold text-lg mt-6">What You'll See</h4>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Total Orders:</strong> The total number of orders placed on your store. Click it to go directly to the Orders page.</li>
          <li><strong>Revenue:</strong> How much money you've made in total. Click it to see detailed financial information.</li>
          <li><strong>Products:</strong> How many products are in your store. Click to manage your products.</li>
          <li><strong>Users:</strong> How many customers have signed up. Click to see your customer list.</li>
        </ul>
        
        <h4 className="font-semibold text-lg mt-6">Quick Actions</h4>
        <p>Below the stats, you'll find shortcuts to common tasks:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Add New Product:</strong> Takes you directly to create a new product</li>
          <li><strong>Create Promotion Code:</strong> Takes you to make a new discount code</li>
          <li><strong>View Recent Orders:</strong> See what orders have come in</li>
        </ul>
      </div>
    ),
  },
  {
    id: "inbox",
    title: "Inbox / Live Chat",
    icon: Inbox,
    keywords: ["inbox", "chat", "messages", "support", "customer", "help", "conversation", "reply", "live chat"],
    content: (
      <div className="space-y-4">
        <p>The Inbox is where you handle customer support messages. When customers use the chat widget on your website, their messages appear here.</p>
        
        <h4 className="font-semibold text-lg mt-6">How to Use the Inbox</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Click on "Inbox" in the sidebar to see all customer conversations</li>
          <li>Conversations with new messages will be highlighted</li>
          <li>Click on a conversation to open it</li>
          <li>Type your reply in the message box at the bottom</li>
          <li>Press Enter or click Send to reply</li>
        </ol>
        
        <h4 className="font-semibold text-lg mt-6">Tips for Good Customer Support</h4>
        <ul className="list-disc pl-6 space-y-2">
          <li>Try to respond quickly - customers appreciate fast replies</li>
          <li>Be friendly and helpful</li>
          <li>If you can't solve something, let them know you're looking into it</li>
          <li>Check the inbox regularly throughout the day</li>
        </ul>
      </div>
    ),
  },
  {
    id: "products",
    title: "Products",
    icon: Package,
    keywords: ["products", "add product", "edit product", "delete product", "stickers", "inventory", "pricing", "tiers", "options", "material", "vinyl", "foil", "holographic", "spot gloss", "varnish", "emboss", "cut type", "die cut", "image", "photo", "description", "category", "slug", "custom shape"],
    content: (
      <div className="space-y-4">
        <p>This is where you manage all your sticker products. You can add new products, edit existing ones, set up pricing, and organize them into categories.</p>
        
        <h4 className="font-semibold text-lg mt-6">Adding a New Product</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Click the "Add Product" button at the top right</li>
          <li>Fill in the product details:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Name:</strong> What customers will see (e.g., "3 inch x 3 inch Die-Cut Stickers")</li>
              <li><strong>Slug:</strong> The web address part (e.g., "3x3-die-cut-stickers"). Use lowercase letters and dashes, no spaces</li>
              <li><strong>Description:</strong> Tell customers about the product</li>
              <li><strong>Category:</strong> Which category this product belongs to</li>
              <li><strong>Base Price:</strong> The starting price</li>
              <li><strong>Image:</strong> Upload a product photo (click or drag to upload)</li>
            </ul>
          </li>
          <li>Click "Create Product" to save</li>
        </ol>
        
        <h4 className="font-semibold text-lg mt-6">Understanding Product Options</h4>
        <p>Every product automatically gets these options that customers can choose from:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Material:</strong>
            <ul className="list-disc pl-6 mt-1">
              <li>Vinyl - Standard material (no extra cost)</li>
              <li>Foil - Shiny metallic finish (+$0.20)</li>
              <li>Holographic - Rainbow/iridescent effect (+$0.20)</li>
            </ul>
          </li>
          <li><strong>Spot Gloss:</strong>
            <ul className="list-disc pl-6 mt-1">
              <li>None - No special finish</li>
              <li>Varnish - Glossy coating (+$0.10)</li>
              <li>Emboss - Raised texture (+$0.10)</li>
              <li>Both - Varnish and emboss together (+$0.20)</li>
            </ul>
          </li>
          <li><strong>Cut Type:</strong>
            <ul className="list-disc pl-6 mt-1">
              <li>Standard - Regular square/rectangle cut</li>
              <li>Die Cut - Custom shape cut around your design</li>
            </ul>
          </li>
        </ul>
        
        <h4 className="font-semibold text-lg mt-6">Setting Up Pricing Tiers</h4>
        <p>Pricing tiers let you offer discounts for larger quantities. For example:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>50-99 stickers: $0.50 each</li>
          <li>100-249 stickers: $0.40 each</li>
          <li>250-499 stickers: $0.30 each</li>
          <li>500+ stickers: $0.25 each</li>
        </ul>
        <p className="mt-2">To set up pricing tiers:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Click on a product to edit it</li>
          <li>Scroll down to the "Pricing Tiers" section</li>
          <li>Click "Add Tier"</li>
          <li>Enter the minimum quantity and price per unit</li>
          <li>Add more tiers as needed</li>
          <li>Save your changes</li>
        </ol>
        
        <h4 className="font-semibold text-lg mt-6">Die-Cut Products (Custom Shape)</h4>
        <p>If your product supports custom die-cut shapes:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Enable "Supports Custom Shape" when creating/editing the product</li>
          <li>This shows a checkerboard pattern in the design editor so customers can see transparency</li>
          <li>The design will export with a transparent background for proper die-cutting</li>
        </ul>
        
        <h4 className="font-semibold text-lg mt-6">Editing a Product</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Find the product in the list</li>
          <li>Click the "Edit" button (pencil icon)</li>
          <li>Make your changes</li>
          <li>Click "Update Product" to save</li>
        </ol>
        
        <h4 className="font-semibold text-lg mt-6">Deleting a Product</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Find the product in the list</li>
          <li>Click the "Delete" button (trash icon)</li>
          <li>Confirm when asked</li>
        </ol>
        <p className="text-amber-600 mt-2"><strong>Warning:</strong> Deleting a product cannot be undone!</p>
      </div>
    ),
  },
  {
    id: "orders",
    title: "Orders",
    icon: ShoppingCart,
    keywords: ["orders", "order status", "pending", "processing", "shipped", "delivered", "cancelled", "tracking", "shipping", "customer", "address", "artwork", "download", "print", "fulfillment"],
    content: (
      <div className="space-y-4">
        <p>The Orders page shows you all customer orders. You can view order details, update statuses, and download print-ready artwork files.</p>
        
        <h4 className="font-semibold text-lg mt-6">Understanding Order Statuses</h4>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Pending:</strong> New order, payment received, waiting to be processed</li>
          <li><strong>Processing:</strong> You're working on the order (printing, cutting, etc.)</li>
          <li><strong>Shipped:</strong> Order has been sent out to the customer</li>
          <li><strong>Delivered:</strong> Customer has received their order</li>
          <li><strong>Cancelled:</strong> Order was cancelled</li>
        </ul>
        
        <h4 className="font-semibold text-lg mt-6">Viewing Order Details</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Click on any order in the list</li>
          <li>You'll see:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Customer information and shipping address</li>
              <li>All items ordered with quantities and options selected</li>
              <li>Financial summary (subtotal, shipping, discounts, total)</li>
              <li>Design files for each item (download these for printing)</li>
            </ul>
          </li>
        </ol>
        
        <h4 className="font-semibold text-lg mt-6">Updating Order Status</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Open the order you want to update</li>
          <li>Find the "Status" dropdown</li>
          <li>Select the new status</li>
          <li>The change saves automatically</li>
        </ol>
        
        <h4 className="font-semibold text-lg mt-6">Adding Tracking Information</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Open the order</li>
          <li>Find the "Tracking Number" field</li>
          <li>Enter the tracking number from your shipping carrier</li>
          <li>Select the carrier (USPS, UPS, FedEx, etc.)</li>
          <li>Save the changes</li>
        </ol>
        <p className="mt-2">Customers will be able to see the tracking information on their order page.</p>
        
        <h4 className="font-semibold text-lg mt-6">Downloading Artwork for Printing</h4>
        <p>Each order item includes the customer's design file:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Open the order</li>
          <li>Find the item you need to print</li>
          <li>Click the "Download Artwork" or design preview</li>
          <li>The file downloads at 300 DPI, ready for printing</li>
        </ol>
        
        <h4 className="font-semibold text-lg mt-6">Order Workflow</h4>
        <p>Here's a typical workflow for handling orders:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>New order comes in (status: Pending)</li>
          <li>Download the artwork files</li>
          <li>Change status to "Processing"</li>
          <li>Print and cut the stickers</li>
          <li>Package the order</li>
          <li>Ship it and enter tracking number</li>
          <li>Change status to "Shipped"</li>
          <li>Once delivered, change to "Delivered"</li>
        </ol>
      </div>
    ),
  },
  {
    id: "users",
    title: "Users",
    icon: Users,
    keywords: ["users", "customers", "accounts", "admin", "role", "email", "name", "profile", "permissions"],
    content: (
      <div className="space-y-4">
        <p>The Users page shows everyone who has created an account on your store. You can view their information and manage admin permissions.</p>
        
        <h4 className="font-semibold text-lg mt-6">Viewing Users</h4>
        <p>The user list shows:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Name</li>
          <li>Email address</li>
          <li>When they signed up</li>
          <li>Whether they're an admin</li>
        </ul>
        
        <h4 className="font-semibold text-lg mt-6">Making Someone an Admin</h4>
        <p>Admins can access this admin panel and manage the store. To make someone an admin:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Find the user in the list</li>
          <li>Click the "Make Admin" button next to their name</li>
          <li>Confirm when asked</li>
        </ol>
        <p className="text-amber-600 mt-2"><strong>Warning:</strong> Only make trusted people admins. They'll have full access to your store data!</p>
        
        <h4 className="font-semibold text-lg mt-6">Removing Admin Access</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Find the admin user in the list</li>
          <li>Click "Remove Admin"</li>
          <li>Confirm when asked</li>
        </ol>
      </div>
    ),
  },
  {
    id: "finances",
    title: "Finances",
    icon: DollarSign,
    keywords: ["finances", "money", "revenue", "sales", "income", "payments", "earnings", "reports", "financial"],
    content: (
      <div className="space-y-4">
        <p>The Finances page gives you a detailed view of your store's money matters.</p>
        
        <h4 className="font-semibold text-lg mt-6">What You'll See</h4>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Total Revenue:</strong> All money you've made</li>
          <li><strong>Order Count:</strong> How many orders have been placed</li>
          <li><strong>Average Order Value:</strong> How much the typical customer spends</li>
        </ul>
        
        <h4 className="font-semibold text-lg mt-6">Payment Processing</h4>
        <p>Payments are handled through Square. When customers pay:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>They enter their card details on the checkout page</li>
          <li>Square processes the payment securely</li>
          <li>Money goes to your Square account</li>
          <li>You can transfer it to your bank from Square</li>
        </ol>
      </div>
    ),
  },
  {
    id: "deals",
    title: "Deals",
    icon: Flame,
    keywords: ["deals", "hot deals", "special", "sale", "discount", "promotion", "fixed price", "fixed quantity", "badge", "featured"],
    content: (
      <div className="space-y-4">
        <p>Deals are special featured products with fixed pricing. They appear on the homepage and the Deals page to attract customers.</p>
        
        <h4 className="font-semibold text-lg mt-6">How Deals Work</h4>
        <p>When you create a deal:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>You pick an existing product as the "source"</li>
          <li>Set a fixed quantity (e.g., 100 stickers)</li>
          <li>Set a fixed price (e.g., $25.00 total)</li>
          <li>A special deal version is created automatically</li>
          <li>Customers can only buy at the fixed quantity and price - no changes allowed</li>
        </ul>
        
        <h4 className="font-semibold text-lg mt-6">Creating a New Deal</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Click "Add Deal" button</li>
          <li>Fill in the details:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Title:</strong> The deal name (e.g., "100 Custom Stickers - $25!")</li>
              <li><strong>Description:</strong> What makes this deal special</li>
              <li><strong>Fixed Price:</strong> The total price for this deal</li>
              <li><strong>Quantity:</strong> How many stickers are included</li>
              <li><strong>Source Product:</strong> Which product this deal is based on</li>
              <li><strong>Badge Text:</strong> What shows on the badge (e.g., "HOT", "SALE")</li>
              <li><strong>Badge Color:</strong> The badge color</li>
              <li><strong>Active:</strong> Whether the deal is live or hidden</li>
            </ul>
          </li>
          <li>Click "Create Deal" to save</li>
        </ol>
        
        <h4 className="font-semibold text-lg mt-6">Editing a Deal</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Find the deal in the list</li>
          <li>Click "Edit"</li>
          <li>Make your changes</li>
          <li>Click "Update Deal"</li>
        </ol>
        
        <h4 className="font-semibold text-lg mt-6">Activating/Deactivating Deals</h4>
        <p>Toggle the "Active" switch to show or hide deals from customers. Inactive deals won't appear on the website.</p>
        
        <h4 className="font-semibold text-lg mt-6">Deleting a Deal</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Find the deal</li>
          <li>Click "Delete"</li>
          <li>Confirm when asked</li>
        </ol>
      </div>
    ),
  },
  {
    id: "promotions",
    title: "Promotions / Discount Codes",
    icon: Tag,
    keywords: ["promotions", "promotion", "discount", "coupon", "code", "promo", "percentage", "fixed amount", "expiry", "expire", "uses", "limit"],
    content: (
      <div className="space-y-4">
        <p>Promotions are discount codes that customers can enter at checkout to save money.</p>
        
        <h4 className="font-semibold text-lg mt-6">Types of Discounts</h4>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Percentage Off:</strong> Takes a percentage off the order (e.g., 10% off)</li>
          <li><strong>Fixed Amount:</strong> Takes a dollar amount off (e.g., $5 off)</li>
        </ul>
        
        <h4 className="font-semibold text-lg mt-6">Creating a Promotion Code</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Click "Add Promotion"</li>
          <li>Fill in:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Code:</strong> What customers type (e.g., "SAVE10"). Keep it simple and easy to remember</li>
              <li><strong>Description:</strong> What the discount is for (internal note)</li>
              <li><strong>Discount Type:</strong> Percentage or Fixed Amount</li>
              <li><strong>Discount Value:</strong> How much off (10 for 10%, or 5 for $5)</li>
              <li><strong>Max Uses:</strong> How many times it can be used total (leave empty for unlimited)</li>
              <li><strong>Expires At:</strong> When the code stops working (leave empty for never)</li>
              <li><strong>Active:</strong> Whether the code works or not</li>
            </ul>
          </li>
          <li>Click "Create Promotion"</li>
        </ol>
        
        <h4 className="font-semibold text-lg mt-6">Tracking Promo Code Usage</h4>
        <p>The promotions list shows how many times each code has been used. Check this to see which promotions are popular.</p>
        
        <h4 className="font-semibold text-lg mt-6">Deactivating a Code</h4>
        <p>If you want to stop a code from working without deleting it:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Find the promotion</li>
          <li>Click Edit</li>
          <li>Turn off "Active"</li>
          <li>Save</li>
        </ol>
      </div>
    ),
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: BarChart3,
    keywords: ["analytics", "google analytics", "tracking", "visitors", "traffic", "pageviews", "reports", "data", "statistics"],
    content: (
      <div className="space-y-4">
        <p>The Analytics page shows information about your Google Analytics setup. This helps you track who visits your website.</p>
        
        <h4 className="font-semibold text-lg mt-6">What is Google Analytics?</h4>
        <p>Google Analytics is a free tool from Google that tracks:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>How many people visit your website</li>
          <li>Which pages they look at</li>
          <li>Where they come from (Google search, social media, etc.)</li>
          <li>What devices they use (phone, computer, tablet)</li>
        </ul>
        
        <h4 className="font-semibold text-lg mt-6">Viewing Your Analytics</h4>
        <p>Your store is connected to Google Analytics. To see detailed reports:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">analytics.google.com</a></li>
          <li>Sign in with your Google account</li>
          <li>Select your website property</li>
          <li>Explore the different reports</li>
        </ol>
        
        <h4 className="font-semibold text-lg mt-6">Note About New Analytics</h4>
        <p>If analytics was just set up, it can take 24-48 hours before data starts appearing. Be patient!</p>
      </div>
    ),
  },
  {
    id: "customize",
    title: "Site Customization",
    icon: Paintbrush,
    keywords: ["customize", "customization", "homepage", "hero", "banner", "features", "text", "content", "sections", "website", "appearance", "look", "design", "cta", "call to action"],
    content: (
      <div className="space-y-4">
        <p>Site Customization lets you change what appears on your homepage without any coding. You can edit text, descriptions, and section content.</p>
        
        <h4 className="font-semibold text-lg mt-6">Homepage Sections You Can Edit</h4>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Hero Section:</strong> The big banner at the top of the homepage
            <ul className="list-disc pl-6 mt-1">
              <li>Main headline</li>
              <li>Subtitle text</li>
              <li>Call-to-action button text</li>
            </ul>
          </li>
          <li><strong>Features:</strong> The feature boxes showing what makes your store special</li>
          <li><strong>Custom Stickers Section:</strong> Information about custom sticker options</li>
          <li><strong>Stickers That Stick:</strong> Quality/durability messaging</li>
          <li><strong>Labels Section:</strong> Information about label products</li>
          <li><strong>Popular Products:</strong> Section header for featured products</li>
          <li><strong>Call to Action (CTA):</strong> The bottom section encouraging action</li>
        </ul>
        
        <h4 className="font-semibold text-lg mt-6">How to Edit a Section</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Click on the tab for the section you want to edit</li>
          <li>Change the text in the input fields</li>
          <li>Click "Save Changes"</li>
          <li>Visit your homepage to see the changes live</li>
        </ol>
        
        <h4 className="font-semibold text-lg mt-6">Tips for Good Website Content</h4>
        <ul className="list-disc pl-6 space-y-2">
          <li>Keep headlines short and catchy</li>
          <li>Use simple language your customers understand</li>
          <li>Highlight what makes your stickers special</li>
          <li>Include action words like "Shop Now" or "Get Started"</li>
        </ul>
      </div>
    ),
  },
  {
    id: "seo",
    title: "SEO (Search Engine Optimization)",
    icon: Globe,
    keywords: ["seo", "search engine", "google", "ranking", "keywords", "meta", "title", "description", "search", "findable", "visibility"],
    content: (
      <div className="space-y-4">
        <p>SEO helps your website show up when people search for stickers on Google. Good SEO = more customers finding you!</p>
        
        <h4 className="font-semibold text-lg mt-6">What is SEO?</h4>
        <p>SEO stands for Search Engine Optimization. It's about making your website easy for Google to understand and recommend to searchers.</p>
        
        <h4 className="font-semibold text-lg mt-6">SEO Settings Page</h4>
        <p>The SEO page lets you set:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Site Title:</strong> What shows in browser tabs and search results</li>
          <li><strong>Site Description:</strong> The snippet that appears under your title in Google</li>
          <li><strong>Keywords:</strong> Words related to your business that help Google understand what you do</li>
        </ul>
        
        <h4 className="font-semibold text-lg mt-6">Tips for Good SEO</h4>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Use descriptive product names:</strong> "3 inch Custom Die-Cut Stickers" is better than just "Stickers"</li>
          <li><strong>Write unique descriptions:</strong> Don't copy the same text for every product</li>
          <li><strong>Include keywords naturally:</strong> Think about what words people would search for
            <ul className="list-disc pl-6 mt-1">
              <li>"custom stickers"</li>
              <li>"die cut stickers"</li>
              <li>"sticker printing"</li>
              <li>"vinyl stickers"</li>
              <li>"holographic stickers"</li>
            </ul>
          </li>
          <li><strong>Use good product images:</strong> Clear, high-quality photos help</li>
        </ul>
        
        <h4 className="font-semibold text-lg mt-6">Product SEO Tips</h4>
        <p>When creating or editing products:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use clear, descriptive product names</li>
          <li>Write detailed descriptions that mention key features</li>
          <li>Choose meaningful slugs (URL parts) - use keywords like "die-cut-stickers" instead of random numbers</li>
          <li>Mention materials, sizes, and use cases in descriptions</li>
        </ul>
        
        <h4 className="font-semibold text-lg mt-6">SEO Takes Time</h4>
        <p>SEO improvements don't show results overnight. It can take weeks or months for Google to recognize changes. Be patient and consistent!</p>
      </div>
    ),
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    keywords: ["settings", "configuration", "options", "preferences", "setup", "store settings"],
    content: (
      <div className="space-y-4">
        <p>The Settings page contains general store configuration options.</p>
        
        <h4 className="font-semibold text-lg mt-6">What You Can Configure</h4>
        <ul className="list-disc pl-6 space-y-2">
          <li>Store name and contact information</li>
          <li>General preferences</li>
          <li>System settings</li>
        </ul>
        
        <h4 className="font-semibold text-lg mt-6">Making Changes</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Find the setting you want to change</li>
          <li>Update the value</li>
          <li>Click Save</li>
        </ol>
      </div>
    ),
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: AlertCircle,
    keywords: ["troubleshoot", "problem", "issue", "error", "help", "broken", "not working", "fix", "stuck"],
    content: (
      <div className="space-y-4">
        <p>Having issues? Here are solutions to common problems:</p>
        
        <h4 className="font-semibold text-lg mt-6">Common Issues</h4>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium">Changes not showing on website</h5>
            <p className="text-sm text-gray-600 mt-1">Try refreshing the page (press F5 or Cmd+R). If that doesn't work, try opening the page in a private/incognito browser window.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium">Can't upload an image</h5>
            <p className="text-sm text-gray-600 mt-1">Make sure the image is a JPG or PNG file and not too large (under 10MB). Try a smaller image if it keeps failing.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium">Product not appearing in store</h5>
            <p className="text-sm text-gray-600 mt-1">Check that the product has a category assigned, has pricing set up, and is not marked as hidden.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium">Promo code not working</h5>
            <p className="text-sm text-gray-600 mt-1">Check that the code is Active, hasn't expired, and hasn't reached its max uses limit.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium">Customer says they can't check out</h5>
            <p className="text-sm text-gray-600 mt-1">Ask them to try a different browser or device. If the issue continues, check if Square payments are working properly.</p>
          </div>
        </div>
      </div>
    ),
  },
];

export default function GuideClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const term = searchTerm.toLowerCase();
    return sections.filter(
      (section) =>
        section.title.toLowerCase().includes(term) ||
        section.keywords.some((keyword) => keyword.toLowerCase().includes(term))
    );
  }, [searchTerm]);

  const scrollToSection = (id: string) => {
    const element = sectionRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-guide-title">
            Admin Help Guide
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Everything you need to know about managing your store
          </p>
        </div>

        <Card className="bg-amber-50 border-amber-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">Need More Help?</h3>
              <p className="text-amber-800 text-sm">
                If you've tried everything and you're still stuck, just call Travis! 
                He's happy to help with any issues you can't figure out.
              </p>
            </div>
          </div>
        </Card>

        <div className="sticky top-0 z-10 bg-gray-100 py-4 -mx-4 px-4 md:-mx-8 md:px-8 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for help (e.g., 'orders', 'pricing', 'seo', 'tracking')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
              data-testid="input-guide-search"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredSections.length} of {sections.length} topics
            </p>
          )}
        </div>

        {!searchTerm && (
          <Card className="p-4 md:p-6 mb-8">
            <h2 className="font-semibold text-lg mb-4">Table of Contents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-50 transition-colors"
                    data-testid={`link-toc-${section.id}`}
                  >
                    <Icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <span className="font-medium">{section.title}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        <div className="space-y-8">
          {filteredSections.length === 0 ? (
            <Card className="p-8 text-center">
              <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-gray-700">No results found</h3>
              <p className="text-gray-500 mt-2">
                Try different keywords, or browse the full guide by clearing your search.
              </p>
              <p className="text-gray-500 mt-4">
                Still can't find what you need? <strong>Call Travis!</strong>
              </p>
            </Card>
          ) : (
            filteredSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.id}
                  ref={(el) => {sectionRefs.current[section.id] = el}}
                  className={`p-4 md:p-6 scroll-mt-24 ${
                    activeSection === section.id ? "ring-2 ring-primary-500" : ""
                  }`}
                  data-testid={`section-${section.id}`}
                >
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    {section.content}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <Card className="mt-8 p-6 bg-gray-900 text-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Still Need Help?</h3>
              <p className="text-gray-300">
                If you've read through everything and still have questions, don't hesitate - just give Travis a call!
                He's always happy to walk you through anything.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
