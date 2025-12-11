import { Link } from "wouter";
import { Mail, Phone, MapPin, Sparkles, Truck, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300">
      {/* Main Footer Content */}
      <div className="container mx-auto px-8 pt-20 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <span className="text-white font-bold text-xl">SB</span>
              </div>
              <span className="font-heading font-bold text-2xl text-white">Sticky Banditos</span>
            </div>
            <p className="text-gray-400 leading-relaxed text-sm">
              Premium custom printing for stickers, business cards, flyers, and more. 
              Quality you can trust, delivered fast.
            </p>
            <div className="flex items-center gap-2 text-orange-400 pt-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium text-sm">Premium Quality Guaranteed</span>
            </div>
          </div>

          {/* Products Column */}
          <div className="space-y-6">
            <h4 className="font-heading font-bold text-white text-lg tracking-wide">Products</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/products" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  Custom Stickers
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  Business Cards
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  Flyers & Posters
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  Postcards & Brochures
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-6">
            <h4 className="font-heading font-bold text-white text-lg tracking-wide">Company</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-6">
            <h4 className="font-heading font-bold text-white text-lg tracking-wide">Contact Us</h4>
            <ul className="space-y-5">
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-gray-300 text-sm">support@stickybanditos.com</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-gray-300 text-sm">(555) 123-4567</span>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-gray-300 text-sm leading-relaxed">123 Print Lane<br />Los Angeles, CA 90001</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Sticky Banditos Printing Company. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-2 text-gray-400">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="text-sm">Premium Quality</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Truck className="w-4 h-4 text-orange-400" />
                <span className="text-sm">Fast Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="w-4 h-4 text-orange-400" />
                <span className="text-sm">Satisfaction Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
