import { Link } from "wouter";
import { Mail, Phone, MapPin, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">SB</span>
              </div>
              <span className="font-heading font-bold text-xl text-white">Sticky Banditos</span>
            </div>
            <p className="text-sm text-gray-400">
              Premium custom printing for stickers, business cards, flyers, and more. 
              Quality you can trust, delivered fast.
            </p>
            <div className="flex items-center gap-2 mt-4 text-orange-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Premium Quality Guaranteed</span>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-bold text-white mb-4 text-lg">Products</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="hover:text-orange-400 transition-colors">
                  Custom Stickers
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-orange-400 transition-colors">
                  Business Cards
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-orange-400 transition-colors">
                  Flyers & Posters
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-orange-400 transition-colors">
                  Postcards
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-white mb-4 text-lg">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-orange-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-orange-400 transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-orange-400 transition-colors">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-orange-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-white mb-4 text-lg">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-400" />
                <span>support@stickybanditos.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-400" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-orange-400 mt-0.5" />
                <span>123 Print Lane<br />Los Angeles, CA 90001</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Sticky Banditos Printing Company. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span className="text-orange-400">Premium Quality</span>
            <span>Fast Shipping</span>
            <span>Satisfaction Guaranteed</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
