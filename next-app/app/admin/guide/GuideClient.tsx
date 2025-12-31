"use client";

import { useState, useMemo, useRef } from "react";
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
    keywords: ["dashboard", "home", "overview", "stats", "statistics", "orders", "revenue", "products", "users", "quick actions", "login", "start"],
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg border-b pb-2">Accessing the Dashboard</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Open your web browser (Chrome, Safari, Firefox, or Edge)</li>
          <li>Go to your website URL and add <code className="bg-gray-100 px-2 py-1 rounded">/admin</code> at the end (example: <code className="bg-gray-100 px-2 py-1 rounded">stickybanditos.com/admin</code>)</li>
          <li>If you're not logged in, you'll see a "Sign In" button - click it</li>
          <li>Log in with your admin account</li>
          <li>You will now see the Dashboard</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Understanding the Statistics Cards</h4>
        <p>At the top of the Dashboard, you'll see 4 colored boxes with numbers:</p>
        <div className="bg-gray-50 p-4 rounded-lg space-y-3 mt-2">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded bg-blue-500 mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Total Orders (Blue Box)</strong>
              <p className="text-sm text-gray-600">Shows the total number of orders ever placed. Click this box to go directly to the Orders page.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded bg-green-500 mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Revenue (Green Box)</strong>
              <p className="text-sm text-gray-600">Shows total money earned from all orders. Click this box to go to the Finances page.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded bg-purple-500 mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Products (Purple Box)</strong>
              <p className="text-sm text-gray-600">Shows how many products are in your store. Click this box to go to the Products page.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded bg-orange-500 mt-1.5 flex-shrink-0"></div>
            <div>
              <strong>Users (Orange Box)</strong>
              <p className="text-sm text-gray-600">Shows how many customer accounts exist. Click this box to go to the Users page.</p>
            </div>
          </div>
        </div>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Using Quick Actions</h4>
        <p>Below the statistics, you'll find a "Quick Actions" box with 3 clickable links:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>"Add New Product"</strong> - Click to go directly to the product creation form</li>
          <li><strong>"Create Promotion Code"</strong> - Click to create a new discount code</li>
          <li><strong>"View Recent Orders"</strong> - Click to see your order list</li>
        </ul>
      </div>
    ),
  },
  {
    id: "inbox",
    title: "Inbox / Live Chat",
    icon: Inbox,
    keywords: ["inbox", "chat", "messages", "support", "customer", "help", "conversation", "reply", "live chat", "respond", "answer", "message"],
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg border-b pb-2">Opening the Inbox</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Look at the left sidebar (the dark menu on the left side of the screen)</li>
          <li>Find and click <strong>"Inbox"</strong> (it has an envelope icon)</li>
          <li>The Inbox page will load showing all customer conversations</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Understanding the Inbox Layout</h4>
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <p><strong>Left Side:</strong> List of all conversations. Each shows the customer's name/email and a preview of their last message.</p>
          <p><strong>Right Side:</strong> The selected conversation's full message history.</p>
          <p><strong>Bottom:</strong> A text box where you type your reply.</p>
        </div>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">How to Reply to a Customer Message</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Click on a conversation in the left list to open it</li>
          <li>Read through the message history to understand what the customer needs</li>
          <li>Click inside the text box at the bottom of the screen</li>
          <li>Type your response</li>
          <li>Click the <strong>"Send"</strong> button (or press Enter on your keyboard)</li>
          <li>Your message will appear in the conversation and the customer will see it on their end</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Identifying New Messages</h4>
        <ul className="list-disc pl-6 space-y-2">
          <li>Conversations with unread messages will appear <strong>highlighted</strong> or show a notification indicator</li>
          <li>Check the Inbox at least 2-3 times per day to ensure customers get timely responses</li>
        </ul>
      </div>
    ),
  },
  {
    id: "products",
    title: "Products",
    icon: Package,
    keywords: ["products", "add product", "edit product", "delete product", "stickers", "inventory", "pricing", "tiers", "options", "material", "vinyl", "foil", "holographic", "spot gloss", "varnish", "emboss", "cut type", "die cut", "image", "photo", "description", "category", "slug", "custom shape", "create product", "new product", "price", "upload"],
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg border-b pb-2">Opening the Products Page</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Look at the left sidebar</li>
          <li>Click <strong>"Products"</strong> (it has a box/package icon)</li>
          <li>You'll see a list of all products in your store</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Creating a New Product - Step by Step</h4>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong>Click the "Add Product" button</strong>
            <p className="text-sm text-gray-600 mt-1">This button is in the top-right corner of the Products page. It's a colored button that says "Add Product".</p>
          </li>
          <li>
            <strong>Fill in the "Name" field</strong>
            <p className="text-sm text-gray-600 mt-1">This is what customers see. Be descriptive. Example: "3 inch x 3 inch Die-Cut Stickers" or "Circle Stickers - 2 inch"</p>
          </li>
          <li>
            <strong>Fill in the "Slug" field</strong>
            <p className="text-sm text-gray-600 mt-1">This becomes part of the web address. Use lowercase letters and dashes only, NO spaces. Example: "3x3-die-cut-stickers" or "circle-stickers-2-inch"</p>
          </li>
          <li>
            <strong>Write the "Description"</strong>
            <p className="text-sm text-gray-600 mt-1">Describe the product in detail. Mention size, what it's good for, materials, etc. This helps with Google searches too.</p>
          </li>
          <li>
            <strong>Select a "Category"</strong>
            <p className="text-sm text-gray-600 mt-1">Click the dropdown menu and choose which category this product belongs to (Die-Cut Stickers, Circle Stickers, etc.)</p>
          </li>
          <li>
            <strong>Enter the "Base Price"</strong>
            <p className="text-sm text-gray-600 mt-1">This is the starting price for the product. Enter just the number (example: 25.00 for $25.00)</p>
          </li>
          <li>
            <strong>Upload a Product Image</strong>
            <p className="text-sm text-gray-600 mt-1">Click the upload area or drag and drop an image file. Use a clear, high-quality photo. JPG or PNG format.</p>
          </li>
          <li>
            <strong>Check "Supports Custom Shape" if applicable</strong>
            <p className="text-sm text-gray-600 mt-1">Check this box if customers can get die-cut (custom shaped) stickers. This shows them a checkerboard background in the design editor so they can see where their sticker will be cut.</p>
          </li>
          <li>
            <strong>Click "Create Product"</strong>
            <p className="text-sm text-gray-600 mt-1">This button is at the bottom of the form. Click it to save the product.</p>
          </li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Product Options (Automatic)</h4>
        <p>Every product you create automatically gets these options that customers can choose from:</p>
        
        <div className="bg-gray-50 p-4 rounded-lg mt-3 space-y-4">
          <div>
            <strong className="text-base">Material Options:</strong>
            <table className="w-full mt-2 text-sm">
              <tbody>
                <tr className="border-b"><td className="py-2 font-medium">Vinyl</td><td>Standard material</td><td className="text-right">No extra cost</td></tr>
                <tr className="border-b"><td className="py-2 font-medium">Foil</td><td>Shiny metallic finish</td><td className="text-right">+$0.20 per sticker</td></tr>
                <tr><td className="py-2 font-medium">Holographic</td><td>Rainbow/iridescent effect</td><td className="text-right">+$0.20 per sticker</td></tr>
              </tbody>
            </table>
          </div>
          
          <div>
            <strong className="text-base">Spot Gloss Options:</strong>
            <table className="w-full mt-2 text-sm">
              <tbody>
                <tr className="border-b"><td className="py-2 font-medium">None</td><td>No special finish</td><td className="text-right">No extra cost</td></tr>
                <tr className="border-b"><td className="py-2 font-medium">Varnish</td><td>Shiny glossy coating</td><td className="text-right">+$0.10 per sticker</td></tr>
                <tr className="border-b"><td className="py-2 font-medium">Emboss</td><td>Raised texture you can feel</td><td className="text-right">+$0.10 per sticker</td></tr>
                <tr><td className="py-2 font-medium">Both</td><td>Varnish + Emboss together</td><td className="text-right">+$0.20 per sticker</td></tr>
              </tbody>
            </table>
          </div>
          
          <div>
            <strong className="text-base">Cut Type Options:</strong>
            <table className="w-full mt-2 text-sm">
              <tbody>
                <tr className="border-b"><td className="py-2 font-medium">Standard</td><td>Square or rectangle cut</td><td className="text-right">No extra cost</td></tr>
                <tr><td className="py-2 font-medium">Die Cut</td><td>Cut around the design shape</td><td className="text-right">No extra cost</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Setting Up Quantity Pricing Tiers</h4>
        <p>Pricing tiers let you offer discounts when customers buy more. For example: 50 stickers = $0.50 each, but 500 stickers = $0.25 each.</p>
        <ol className="list-decimal pl-6 space-y-2 mt-3">
          <li>Go to the Products page and find the product you want to edit</li>
          <li>Click the <strong>"Edit"</strong> button (pencil icon) next to that product</li>
          <li>Scroll down until you see the <strong>"Pricing Tiers"</strong> section</li>
          <li>Click the <strong>"Add Tier"</strong> button</li>
          <li>In the <strong>"Min Quantity"</strong> field, enter the minimum number of stickers for this price (example: 50)</li>
          <li>In the <strong>"Price Per Unit"</strong> field, enter the price per sticker (example: 0.50 for 50 cents each)</li>
          <li>Click "Add Tier" again to add more pricing levels</li>
          <li>Click <strong>"Update Product"</strong> to save all changes</li>
        </ol>
        
        <div className="bg-blue-50 p-4 rounded-lg mt-4">
          <strong>Example Pricing Tier Setup:</strong>
          <table className="w-full mt-2 text-sm">
            <thead className="border-b">
              <tr><th className="text-left py-2">Min Quantity</th><th className="text-left">Price Per Unit</th><th className="text-left">Customer Sees</th></tr>
            </thead>
            <tbody>
              <tr className="border-b"><td className="py-2">50</td><td>$0.50</td><td>50+ stickers: $0.50 each</td></tr>
              <tr className="border-b"><td className="py-2">100</td><td>$0.40</td><td>100+ stickers: $0.40 each</td></tr>
              <tr className="border-b"><td className="py-2">250</td><td>$0.30</td><td>250+ stickers: $0.30 each</td></tr>
              <tr><td className="py-2">500</td><td>$0.25</td><td>500+ stickers: $0.25 each</td></tr>
            </tbody>
          </table>
        </div>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Editing an Existing Product</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to the Products page</li>
          <li>Find the product you want to change in the list</li>
          <li>Click the <strong>"Edit" button</strong> (pencil icon) on the right side of that product's row</li>
          <li>The edit form will appear with all the current product information</li>
          <li>Change any fields you need to update</li>
          <li>Click <strong>"Update Product"</strong> at the bottom to save your changes</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Deleting a Product</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to the Products page</li>
          <li>Find the product you want to delete</li>
          <li>Click the <strong>"Delete" button</strong> (trash can icon) on the right side</li>
          <li>A confirmation popup will appear asking "Are you sure?"</li>
          <li>Click <strong>"Yes"</strong> or <strong>"Confirm"</strong> to delete</li>
        </ol>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mt-3">
          <strong className="text-red-800">Warning:</strong>
          <p className="text-red-700 text-sm mt-1">Deleting a product CANNOT be undone. The product and all its settings will be permanently removed. Make sure you really want to delete it before confirming.</p>
        </div>
      </div>
    ),
  },
  {
    id: "orders",
    title: "Orders",
    icon: ShoppingCart,
    keywords: ["orders", "order status", "pending", "processing", "shipped", "delivered", "cancelled", "tracking", "shipping", "customer", "address", "artwork", "download", "print", "fulfillment", "status", "tracking number", "carrier", "view order", "update order"],
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg border-b pb-2">Opening the Orders Page</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Look at the left sidebar</li>
          <li>Click <strong>"Orders"</strong> (it has a shopping cart icon)</li>
          <li>You'll see a list of all orders with the most recent at the top</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Understanding Order Statuses</h4>
        <p>Every order has a status that tells you where it is in the process:</p>
        <div className="bg-gray-50 p-4 rounded-lg mt-3 space-y-3">
          <div className="flex items-start gap-3">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">PENDING</span>
            <p className="text-sm">New order just came in. Payment is complete. You need to start working on it.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">PROCESSING</span>
            <p className="text-sm">You're actively working on this order (printing, cutting, packaging).</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">SHIPPED</span>
            <p className="text-sm">Order has been mailed out and is on its way to the customer.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">DELIVERED</span>
            <p className="text-sm">Customer has received their order. Job complete!</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">CANCELLED</span>
            <p className="text-sm">Order was cancelled. No action needed.</p>
          </div>
        </div>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Viewing Order Details</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to the Orders page</li>
          <li>Find the order you want to view in the list</li>
          <li>Click anywhere on that order's row (or click a "View" button if there is one)</li>
          <li>The order details page will open showing:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Customer Information:</strong> Name, email, phone number</li>
              <li><strong>Shipping Address:</strong> Where to send the order</li>
              <li><strong>Order Items:</strong> What they ordered, quantities, options selected (material, gloss, etc.)</li>
              <li><strong>Financial Summary:</strong> Subtotal, shipping cost, any discounts, total paid</li>
              <li><strong>Design Files:</strong> The artwork to print (this is what you download)</li>
            </ul>
          </li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Changing Order Status - Step by Step</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Open the order you want to update (click on it from the orders list)</li>
          <li>Look for the <strong>"Status"</strong> section - it shows the current status with a dropdown menu</li>
          <li>Click the dropdown menu</li>
          <li>Select the new status:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Select <strong>"Processing"</strong> when you start working on it</li>
              <li>Select <strong>"Shipped"</strong> when you mail it out</li>
              <li>Select <strong>"Delivered"</strong> when the customer confirms receipt (or tracking shows delivered)</li>
            </ul>
          </li>
          <li>The status saves automatically when you select it</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Adding Tracking Information</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Open the order you want to add tracking to</li>
          <li>Find the <strong>"Tracking"</strong> section</li>
          <li>In the <strong>"Tracking Number"</strong> field, type or paste the tracking number from your shipping receipt (example: 9400111899223847654321)</li>
          <li>In the <strong>"Carrier"</strong> dropdown, select the shipping company:
            <ul className="list-disc pl-6 mt-1">
              <li>USPS - United States Postal Service</li>
              <li>UPS - United Parcel Service</li>
              <li>FedEx</li>
              <li>DHL</li>
            </ul>
          </li>
          <li>Click <strong>"Save"</strong> or <strong>"Update"</strong></li>
          <li>The customer will be able to see this tracking information when they check their order</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Downloading Artwork for Printing</h4>
        <p>Each order contains the customer's design file that you need to print. Here's how to get it:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Open the order details</li>
          <li>Scroll down to the <strong>"Order Items"</strong> section</li>
          <li>Each item will show a preview of the design</li>
          <li>Click the <strong>"Download"</strong> button or click on the design preview image</li>
          <li>The file will download to your computer (check your Downloads folder)</li>
          <li>The file is 300 DPI, print-ready quality</li>
        </ol>
        
        <div className="bg-blue-50 p-4 rounded-lg mt-4">
          <strong>Recommended Order Workflow:</strong>
          <ol className="list-decimal pl-6 mt-2 text-sm space-y-1">
            <li>New order comes in → Status is "Pending"</li>
            <li>Download all artwork files</li>
            <li>Change status to "Processing"</li>
            <li>Print the stickers</li>
            <li>Cut the stickers</li>
            <li>Package the order</li>
            <li>Take it to the post office / schedule pickup</li>
            <li>Enter tracking number</li>
            <li>Change status to "Shipped"</li>
            <li>When tracking shows delivered → Change status to "Delivered"</li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    id: "users",
    title: "Users",
    icon: Users,
    keywords: ["users", "customers", "accounts", "admin", "role", "email", "name", "profile", "permissions", "make admin", "remove admin"],
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg border-b pb-2">Opening the Users Page</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Look at the left sidebar</li>
          <li>Click <strong>"Users"</strong> (it has a people icon)</li>
          <li>You'll see a list of all registered users/customers</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Understanding the Users List</h4>
        <p>The table shows:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Name:</strong> The customer's name</li>
          <li><strong>Email:</strong> Their email address</li>
          <li><strong>Role:</strong> Either "User" (regular customer) or "Admin" (has admin access)</li>
          <li><strong>Signed Up:</strong> When they created their account</li>
        </ul>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Making Someone an Admin</h4>
        <p>Admins can access this admin panel and manage everything. Only give admin access to people you trust completely.</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to the Users page</li>
          <li>Find the person you want to make an admin</li>
          <li>Click the <strong>"Make Admin"</strong> button next to their name</li>
          <li>Confirm when the popup asks "Are you sure?"</li>
          <li>Their role will change from "User" to "Admin"</li>
          <li>They can now access the admin panel by going to /admin</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Removing Admin Access</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to the Users page</li>
          <li>Find the admin you want to remove access from</li>
          <li>Click the <strong>"Remove Admin"</strong> button next to their name</li>
          <li>Confirm when asked</li>
          <li>They will no longer be able to access the admin panel</li>
        </ol>
        
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mt-4">
          <strong className="text-red-800">Warning About Admin Access:</strong>
          <p className="text-red-700 text-sm mt-1">Admins can see all orders, customer information, change prices, delete products, and access everything in the admin panel. Only make someone an admin if you completely trust them with your business.</p>
        </div>
      </div>
    ),
  },
  {
    id: "finances",
    title: "Finances",
    icon: DollarSign,
    keywords: ["finances", "money", "revenue", "sales", "income", "payments", "earnings", "reports", "financial", "square", "bank"],
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg border-b pb-2">Opening the Finances Page</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Look at the left sidebar</li>
          <li>Click <strong>"Finances"</strong> (it has a dollar sign icon)</li>
          <li>You'll see financial statistics and information</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Understanding the Financial Summary</h4>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Total Revenue:</strong> All money earned from completed orders</li>
          <li><strong>Order Count:</strong> Total number of orders placed</li>
          <li><strong>Average Order Value:</strong> Revenue divided by number of orders - shows typical order size</li>
        </ul>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">How Payments Work</h4>
        <p>Your store uses Square for payment processing. Here's the flow:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Customer adds items to cart and goes to checkout</li>
          <li>They enter their credit card information</li>
          <li>Square securely processes the payment</li>
          <li>Money goes into your Square account</li>
          <li>You transfer money from Square to your bank account (through the Square Dashboard)</li>
        </ol>
        
        <div className="bg-blue-50 p-4 rounded-lg mt-4">
          <strong>To manage your Square account and transfer funds:</strong>
          <ol className="list-decimal pl-6 mt-2 text-sm space-y-1">
            <li>Go to <strong>squareup.com</strong></li>
            <li>Log in with your Square account</li>
            <li>View your balance and transactions</li>
            <li>Transfer funds to your bank account</li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    id: "deals",
    title: "Deals",
    icon: Flame,
    keywords: ["deals", "hot deals", "special", "sale", "discount", "promotion", "fixed price", "fixed quantity", "badge", "featured", "create deal", "add deal"],
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg border-b pb-2">What Are Deals?</h4>
        <p>Deals are special featured offers with a <strong>fixed quantity</strong> and <strong>fixed price</strong>. Unlike regular products where customers choose their quantity, deals are "take it or leave it" packages.</p>
        <p className="mt-2">Example: "100 Custom Stickers for $25!" - the customer gets exactly 100 stickers for exactly $25, no changes allowed.</p>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Opening the Deals Page</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Look at the left sidebar</li>
          <li>Click <strong>"Deals"</strong> (it has a flame icon)</li>
          <li>You'll see a list of all current deals</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Creating a New Deal - Step by Step</h4>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong>Click the "Add Deal" button</strong>
            <p className="text-sm text-gray-600 mt-1">Located in the top-right corner of the Deals page.</p>
          </li>
          <li>
            <strong>Fill in the "Title" field</strong>
            <p className="text-sm text-gray-600 mt-1">This is what customers see. Make it catchy! Example: "100 Custom Stickers - Only $25!"</p>
          </li>
          <li>
            <strong>Write the "Description"</strong>
            <p className="text-sm text-gray-600 mt-1">Explain why this is a great deal. Example: "Get 100 high-quality vinyl stickers at our lowest price ever!"</p>
          </li>
          <li>
            <strong>Enter the "Fixed Price"</strong>
            <p className="text-sm text-gray-600 mt-1">The total price for the entire deal. Just the number, no dollar sign. Example: 25.00</p>
          </li>
          <li>
            <strong>Enter the "Quantity"</strong>
            <p className="text-sm text-gray-600 mt-1">How many stickers are included in this deal. Example: 100</p>
          </li>
          <li>
            <strong>Select the "Source Product"</strong>
            <p className="text-sm text-gray-600 mt-1">Choose which of your existing products this deal is based on. The deal will use that product's settings.</p>
          </li>
          <li>
            <strong>Enter "Product Size" (optional)</strong>
            <p className="text-sm text-gray-600 mt-1">Display text for the size. Example: "3 inch"</p>
          </li>
          <li>
            <strong>Enter "Product Type" (optional)</strong>
            <p className="text-sm text-gray-600 mt-1">Display text for the type. Example: "Die-Cut Stickers"</p>
          </li>
          <li>
            <strong>Enter "Badge Text"</strong>
            <p className="text-sm text-gray-600 mt-1">The small label that appears on the deal. Examples: "HOT", "SALE", "LIMITED", "BEST VALUE"</p>
          </li>
          <li>
            <strong>Select "Badge Color"</strong>
            <p className="text-sm text-gray-600 mt-1">Choose the color for the badge. Red is common for "hot" deals, green for "value" deals.</p>
          </li>
          <li>
            <strong>Toggle "Active" on or off</strong>
            <p className="text-sm text-gray-600 mt-1">Active deals appear on the website. Turn off to hide a deal without deleting it.</p>
          </li>
          <li>
            <strong>Click "Create Deal"</strong>
            <p className="text-sm text-gray-600 mt-1">The deal will be saved and (if active) will appear on your homepage and Deals page.</p>
          </li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Editing a Deal</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to the Deals page</li>
          <li>Find the deal you want to change</li>
          <li>Click the <strong>"Edit"</strong> button</li>
          <li>Make your changes</li>
          <li>Click <strong>"Update Deal"</strong></li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Turning a Deal On or Off</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to the Deals page</li>
          <li>Find the deal</li>
          <li>Click Edit</li>
          <li>Toggle the <strong>"Active"</strong> switch on or off</li>
          <li>Click Update Deal</li>
        </ol>
        <p className="text-sm text-gray-600 mt-2">When a deal is inactive, customers cannot see or purchase it. This is useful for seasonal deals or limited-time offers.</p>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Deleting a Deal</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to the Deals page</li>
          <li>Find the deal you want to delete</li>
          <li>Click the <strong>"Delete"</strong> button</li>
          <li>Confirm when asked</li>
        </ol>
      </div>
    ),
  },
  {
    id: "promotions",
    title: "Promotions / Discount Codes",
    icon: Tag,
    keywords: ["promotions", "promotion", "discount", "coupon", "code", "promo", "percentage", "fixed amount", "expiry", "expire", "uses", "limit", "create code", "add promotion"],
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg border-b pb-2">What Are Promotions?</h4>
        <p>Promotions are discount codes that customers type in at checkout to save money. Examples: "SAVE10" for 10% off, or "WELCOME5" for $5 off.</p>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Opening the Promotions Page</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Look at the left sidebar</li>
          <li>Click <strong>"Promotions"</strong> (it has a price tag icon)</li>
          <li>You'll see a list of all promotion codes</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Creating a Promotion Code - Step by Step</h4>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong>Click the "Add Promotion" button</strong>
            <p className="text-sm text-gray-600 mt-1">Located in the top-right corner.</p>
          </li>
          <li>
            <strong>Enter the "Code"</strong>
            <p className="text-sm text-gray-600 mt-1">This is what customers type at checkout. Keep it simple and easy to remember. Use only letters and numbers, no spaces. Examples: SAVE10, SUMMER2024, WELCOME, FRIENDS20</p>
          </li>
          <li>
            <strong>Enter the "Description"</strong>
            <p className="text-sm text-gray-600 mt-1">A note for yourself about what this code is for. Customers don't see this. Example: "Summer sale promotion" or "Influencer discount code"</p>
          </li>
          <li>
            <strong>Select "Discount Type"</strong>
            <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
              <li><strong>Percentage:</strong> Takes a percentage off the total (10 = 10% off)</li>
              <li><strong>Fixed Amount:</strong> Takes a dollar amount off (5 = $5 off)</li>
            </ul>
          </li>
          <li>
            <strong>Enter "Discount Value"</strong>
            <p className="text-sm text-gray-600 mt-1">Just the number. For 10% off, enter: 10. For $5 off, enter: 5</p>
          </li>
          <li>
            <strong>Enter "Max Uses" (optional)</strong>
            <p className="text-sm text-gray-600 mt-1">How many times total this code can be used. Leave empty for unlimited uses. Example: 100 means the code stops working after 100 people use it.</p>
          </li>
          <li>
            <strong>Set "Expires At" (optional)</strong>
            <p className="text-sm text-gray-600 mt-1">When the code stops working. Click the date picker and select a date. Leave empty if the code never expires.</p>
          </li>
          <li>
            <strong>Toggle "Active" on</strong>
            <p className="text-sm text-gray-600 mt-1">The code only works if Active is turned on.</p>
          </li>
          <li>
            <strong>Click "Create Promotion"</strong>
          </li>
        </ol>
        
        <div className="bg-blue-50 p-4 rounded-lg mt-4">
          <strong>Example Promotion Setups:</strong>
          <table className="w-full mt-2 text-sm">
            <thead className="border-b">
              <tr><th className="text-left py-2">Code</th><th className="text-left">Type</th><th className="text-left">Value</th><th className="text-left">Result</th></tr>
            </thead>
            <tbody>
              <tr className="border-b"><td className="py-2">SAVE10</td><td>Percentage</td><td>10</td><td>10% off entire order</td></tr>
              <tr className="border-b"><td className="py-2">WELCOME5</td><td>Fixed Amount</td><td>5</td><td>$5 off entire order</td></tr>
              <tr><td className="py-2">HALFOFF</td><td>Percentage</td><td>50</td><td>50% off entire order</td></tr>
            </tbody>
          </table>
        </div>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Checking How Many Times a Code Was Used</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to the Promotions page</li>
          <li>Look at the list of codes</li>
          <li>Each row shows how many times that code has been used</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Turning Off a Promotion Code</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to the Promotions page</li>
          <li>Find the code you want to disable</li>
          <li>Click <strong>"Edit"</strong></li>
          <li>Toggle <strong>"Active"</strong> to off (the switch should be gray/off)</li>
          <li>Click <strong>"Update"</strong></li>
        </ol>
        <p className="text-sm text-gray-600 mt-2">The code will immediately stop working. Customers who try to use it will get an error message.</p>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Deleting a Promotion</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to the Promotions page</li>
          <li>Find the code</li>
          <li>Click <strong>"Delete"</strong></li>
          <li>Confirm when asked</li>
        </ol>
      </div>
    ),
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: BarChart3,
    keywords: ["analytics", "google analytics", "tracking", "visitors", "traffic", "pageviews", "reports", "data", "statistics", "google"],
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg border-b pb-2">What is Analytics?</h4>
        <p>Analytics tells you how many people visit your website, which pages they look at, and where they came from (Google search, social media, etc.).</p>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Opening the Analytics Page</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Look at the left sidebar</li>
          <li>Click <strong>"Analytics"</strong> (it has a bar chart icon)</li>
          <li>You'll see information about your Google Analytics setup</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Viewing Detailed Analytics Reports</h4>
        <p>To see full analytics data (visitors, page views, traffic sources), you need to go to Google Analytics:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Open a new browser tab</li>
          <li>Go to <strong>analytics.google.com</strong></li>
          <li>Sign in with your Google account (the same one connected to your website)</li>
          <li>Select your website property from the list</li>
          <li>Explore the different reports:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Realtime:</strong> See who's on your site right now</li>
              <li><strong>Audience:</strong> Who your visitors are (location, device, etc.)</li>
              <li><strong>Acquisition:</strong> How people find your site (Google, social media, direct)</li>
              <li><strong>Behavior:</strong> What pages people look at</li>
            </ul>
          </li>
        </ol>
        
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mt-4">
          <strong className="text-amber-800">Important Note:</strong>
          <p className="text-amber-700 text-sm mt-1">If Google Analytics was recently set up, it can take 24-48 hours before data starts appearing. This is normal - just check back later.</p>
        </div>
      </div>
    ),
  },
  {
    id: "customize",
    title: "Site Customization",
    icon: Paintbrush,
    keywords: ["customize", "customization", "homepage", "hero", "banner", "features", "text", "content", "sections", "website", "appearance", "look", "design", "cta", "call to action", "edit homepage", "change text"],
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg border-b pb-2">What is Site Customization?</h4>
        <p>This lets you change the text and content that appears on your homepage without needing to know any code.</p>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Opening Site Customization</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Look at the left sidebar</li>
          <li>Click <strong>"Site Customization"</strong> (it has a paintbrush icon)</li>
          <li>You'll see tabs for different sections of the homepage</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Understanding the Tabs</h4>
        <p>Each tab controls a different part of your homepage:</p>
        <div className="bg-gray-50 p-4 rounded-lg mt-3 space-y-3">
          <div>
            <strong>Hero Section</strong>
            <p className="text-sm text-gray-600">The big banner at the very top of your homepage. Contains the main headline and call-to-action button.</p>
          </div>
          <div>
            <strong>Features</strong>
            <p className="text-sm text-gray-600">The feature boxes that highlight what makes your store special (fast shipping, quality materials, etc.).</p>
          </div>
          <div>
            <strong>Custom Stickers</strong>
            <p className="text-sm text-gray-600">Section about custom sticker options.</p>
          </div>
          <div>
            <strong>Stickers That Stick</strong>
            <p className="text-sm text-gray-600">Section about quality and durability.</p>
          </div>
          <div>
            <strong>Labels</strong>
            <p className="text-sm text-gray-600">Section about label products.</p>
          </div>
          <div>
            <strong>Popular Products</strong>
            <p className="text-sm text-gray-600">Section header for featured products.</p>
          </div>
          <div>
            <strong>CTA (Call to Action)</strong>
            <p className="text-sm text-gray-600">The bottom section that encourages visitors to take action (shop now, get started, etc.).</p>
          </div>
        </div>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">How to Edit Homepage Text</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to Site Customization</li>
          <li>Click on the tab for the section you want to edit (example: "Hero")</li>
          <li>You'll see text fields with the current content</li>
          <li>Click inside any text field and change the text</li>
          <li>Click the <strong>"Save Changes"</strong> button</li>
          <li>Open your homepage in a new tab to see the changes live</li>
        </ol>
        
        <div className="bg-blue-50 p-4 rounded-lg mt-4">
          <strong>Tips for Good Website Content:</strong>
          <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
            <li>Keep headlines short and catchy (under 10 words)</li>
            <li>Use action words like "Shop Now", "Get Started", "Order Today"</li>
            <li>Mention what makes your stickers special (quality, fast shipping, custom designs)</li>
            <li>Check your changes on mobile too - most customers browse on their phones</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "seo",
    title: "SEO (Search Engine Optimization)",
    icon: Globe,
    keywords: ["seo", "search engine", "google", "ranking", "keywords", "meta", "title", "description", "search", "findable", "visibility", "google search", "search results"],
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg border-b pb-2">What is SEO?</h4>
        <p>SEO (Search Engine Optimization) is about making your website show up when people search on Google. Better SEO = more people finding your store when they search for "custom stickers" or similar terms.</p>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Opening the SEO Page</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Look at the left sidebar</li>
          <li>Click <strong>"SEO"</strong> (it has a search/globe icon)</li>
          <li>You'll see fields for your site's SEO settings</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">SEO Settings Explained</h4>
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div>
            <strong>Site Title</strong>
            <p className="text-sm text-gray-600">What appears in the browser tab and Google search results as your website name.</p>
            <p className="text-sm text-blue-600 mt-1">Example: "Sticky Banditos - Custom Stickers & Labels"</p>
          </div>
          <div>
            <strong>Site Description</strong>
            <p className="text-sm text-gray-600">The short description that appears under your title in Google search results. Should be 150-160 characters.</p>
            <p className="text-sm text-blue-600 mt-1">Example: "Premium custom stickers and labels. Die-cut, vinyl, holographic options. Fast shipping from Phoenix, AZ. Design online or upload your artwork."</p>
          </div>
          <div>
            <strong>Keywords</strong>
            <p className="text-sm text-gray-600">Words and phrases related to your business that help Google understand what you do.</p>
            <p className="text-sm text-blue-600 mt-1">Example: custom stickers, die cut stickers, vinyl stickers, sticker printing, holographic stickers, label printing, Phoenix stickers</p>
          </div>
        </div>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">How to Update SEO Settings</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Go to the SEO page</li>
          <li>Update the Site Title, Description, and Keywords fields</li>
          <li>Click <strong>"Save"</strong></li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">SEO Tips for Products</h4>
        <p>When creating or editing products, these things help Google find them:</p>
        <div className="bg-gray-50 p-4 rounded-lg mt-3 space-y-3">
          <div>
            <strong>Product Names</strong>
            <p className="text-sm text-gray-600">Be descriptive. Instead of "3 inch stickers", use "3 inch Custom Die-Cut Vinyl Stickers"</p>
          </div>
          <div>
            <strong>Product Descriptions</strong>
            <p className="text-sm text-gray-600">Write detailed descriptions that mention:
              <ul className="list-disc pl-6 mt-1">
                <li>Size (3 inch, 4 inch, etc.)</li>
                <li>Material (vinyl, holographic, foil)</li>
                <li>Type (die-cut, circle, square)</li>
                <li>Use cases (laptop stickers, product labels, bumper stickers)</li>
              </ul>
            </p>
          </div>
          <div>
            <strong>Product Slugs (URLs)</strong>
            <p className="text-sm text-gray-600">Use keyword-rich slugs. Instead of "product-1", use "3-inch-die-cut-vinyl-stickers"</p>
          </div>
        </div>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">Good Keywords to Use</h4>
        <p>Include these types of keywords in your products and site settings:</p>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>custom stickers</li>
          <li>die cut stickers</li>
          <li>vinyl stickers</li>
          <li>sticker printing</li>
          <li>holographic stickers</li>
          <li>foil stickers</li>
          <li>waterproof stickers</li>
          <li>laptop stickers</li>
          <li>bumper stickers</li>
          <li>product labels</li>
          <li>custom labels</li>
          <li>stickers Phoenix (local SEO)</li>
        </ul>
        
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mt-6">
          <strong className="text-amber-800">Important:</strong>
          <p className="text-amber-700 text-sm mt-1">SEO changes take time to show results. Google needs to re-index your site, which can take days or weeks. Don't expect to see ranking improvements immediately. Consistency is key - keep your content updated and relevant.</p>
        </div>
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
        <h4 className="font-semibold text-lg border-b pb-2">Opening Settings</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Look at the left sidebar</li>
          <li>Click <strong>"Settings"</strong> (it has a gear icon)</li>
          <li>You'll see various store configuration options</li>
        </ol>
        
        <h4 className="font-semibold text-lg border-b pb-2 mt-8">How to Change a Setting</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Find the setting you want to change</li>
          <li>Update the value (type in new text, flip a switch, etc.)</li>
          <li>Click <strong>"Save"</strong> or <strong>"Update Settings"</strong></li>
          <li>Your changes will take effect immediately</li>
        </ol>
      </div>
    ),
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting Common Issues",
    icon: AlertCircle,
    keywords: ["troubleshoot", "problem", "issue", "error", "help", "broken", "not working", "fix", "stuck", "bug", "wrong"],
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg border-b pb-2">Common Problems and Solutions</h4>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium">Problem: Changes I made aren't showing on the website</h5>
            <p className="text-sm text-gray-600 mt-2"><strong>Solution:</strong></p>
            <ol className="list-decimal pl-6 text-sm text-gray-600 space-y-1">
              <li>Press <strong>Ctrl+Shift+R</strong> (Windows) or <strong>Cmd+Shift+R</strong> (Mac) to hard refresh the page</li>
              <li>If that doesn't work, open the website in an Incognito/Private browser window</li>
              <li>Wait 1-2 minutes and try again - sometimes changes take a moment to appear</li>
            </ol>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium">Problem: I can't upload a product image</h5>
            <p className="text-sm text-gray-600 mt-2"><strong>Solution:</strong></p>
            <ol className="list-decimal pl-6 text-sm text-gray-600 space-y-1">
              <li>Make sure the image is a JPG or PNG file (not PDF, TIFF, or other formats)</li>
              <li>Make sure the file is under 10MB in size</li>
              <li>Try a smaller image - very large images may fail to upload</li>
              <li>Try a different browser (Chrome, Firefox, Safari, Edge)</li>
            </ol>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium">Problem: A product isn't appearing in the store</h5>
            <p className="text-sm text-gray-600 mt-2"><strong>Solution:</strong></p>
            <ol className="list-decimal pl-6 text-sm text-gray-600 space-y-1">
              <li>Check that the product has a category assigned</li>
              <li>Check that the product has at least one pricing tier set up</li>
              <li>Check that the product has an image uploaded</li>
              <li>Make sure you clicked "Save" or "Update Product" after editing</li>
            </ol>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium">Problem: Promo code isn't working for customers</h5>
            <p className="text-sm text-gray-600 mt-2"><strong>Solution:</strong></p>
            <ol className="list-decimal pl-6 text-sm text-gray-600 space-y-1">
              <li>Go to Promotions and find the code</li>
              <li>Check that "Active" is turned ON</li>
              <li>Check that it hasn't expired (look at the Expires At date)</li>
              <li>Check that it hasn't reached its max uses limit</li>
              <li>Make sure the customer is typing the code exactly right (case doesn't matter)</li>
            </ol>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium">Problem: Customer says checkout isn't working</h5>
            <p className="text-sm text-gray-600 mt-2"><strong>Solution:</strong></p>
            <ol className="list-decimal pl-6 text-sm text-gray-600 space-y-1">
              <li>Ask the customer to try a different browser</li>
              <li>Ask if they're using a VPN - have them try without it</li>
              <li>Have them try a different credit card</li>
              <li>Check your Square dashboard to see if payments are working</li>
              <li>If nothing works, call Travis</li>
            </ol>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium">Problem: I can't log in to the admin panel</h5>
            <p className="text-sm text-gray-600 mt-2"><strong>Solution:</strong></p>
            <ol className="list-decimal pl-6 text-sm text-gray-600 space-y-1">
              <li>Make sure you're using the correct email/account</li>
              <li>Make sure your account has admin permissions (ask another admin to check)</li>
              <li>Try logging out and logging back in</li>
              <li>Clear your browser cookies and try again</li>
              <li>Try a different browser</li>
            </ol>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium">Problem: Order artwork won't download</h5>
            <p className="text-sm text-gray-600 mt-2"><strong>Solution:</strong></p>
            <ol className="list-decimal pl-6 text-sm text-gray-600 space-y-1">
              <li>Check your Downloads folder - the file may have downloaded but you missed it</li>
              <li>Try right-clicking the download link and selecting "Save Link As..."</li>
              <li>Try a different browser</li>
              <li>Check if your browser is blocking downloads (look for a blocked download warning)</li>
            </ol>
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
            Admin Panel Instruction Manual
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Step-by-step instructions for everything in the admin panel
          </p>
        </div>

        <Card className="bg-amber-50 border-amber-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">Still Stuck? Call Travis!</h3>
              <p className="text-amber-800 text-sm">
                If you've tried the instructions here and something still isn't working, don't stress - just give Travis a call. He can walk you through anything over the phone.
              </p>
            </div>
          </div>
        </Card>

        <div className="sticky top-0 z-10 bg-gray-100 py-4 -mx-4 px-4 md:-mx-8 md:px-8 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search: 'add product', 'tracking number', 'promo code', 'SEO'..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
              data-testid="input-guide-search"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-500 mt-2">
              Found {filteredSections.length} matching topic{filteredSections.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {!searchTerm && (
          <Card className="p-4 md:p-6 mb-8">
            <h2 className="font-semibold text-lg mb-4">Quick Navigation - Jump to Section</h2>
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
              <h3 className="font-semibold text-lg text-gray-700">No matching instructions found</h3>
              <p className="text-gray-500 mt-2">
                Try different keywords, or clear your search to see all topics.
              </p>
              <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                <p className="text-amber-800">
                  Can't find what you need? <strong>Just call Travis!</strong> He'll help you figure it out.
                </p>
              </div>
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
              <h3 className="font-bold text-lg">When All Else Fails - Call Travis!</h3>
              <p className="text-gray-300">
                Seriously, if you've read through the instructions and something still doesn't make sense or isn't working, don't waste time struggling. Just pick up the phone and call. That's what he's there for!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
