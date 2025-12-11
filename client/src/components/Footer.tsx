import { Link } from "wouter";
import { Mail, Phone, MapPin, Sparkles, Truck, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="bg-gray-900">
      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500">
        <div className="container mx-auto px-6 md:px-12 pt-8 pb-10 md:pt-10 md:pb-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="font-heading text-2xl md:text-3xl text-white mb-3">Ready to Print?</h3>
              <p className="text-white/90 text-lg">Start your custom order today and get free shipping on orders over $75</p>
            </div>
            <Link href="/products">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 shadow-lg px-8 mb-6">
                Browse Products <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-6 md:px-12">
        <div className="pt-10 pb-16 md:pt-12 md:pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <span className="text-white font-bold text-xl">SB</span>
                </div>
                <div>
                  <span className="font-heading font-bold text-xl text-white block">Sticky Banditos</span>
                  <span className="text-gray-500 text-xs">Printing Company</span>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed text-sm max-w-xs">
                Premium custom printing for stickers, business cards, flyers, and more. 
                Quality you can trust, delivered fast.
              </p>
              <div className="flex items-center gap-2 text-orange-400">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium text-sm">Quality Guaranteed</span>
              </div>
            </div>

            {/* Products Column */}
            <div className="space-y-6">
              <h4 className="font-heading font-bold text-white text-sm tracking-wider uppercase">Products</h4>
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
                    Postcards
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                    Brochures
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="space-y-6">
              <h4 className="font-heading font-bold text-white text-sm tracking-wider uppercase">Company</h4>
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
                <li>
                  <Link href="/" className="text-gray-400 hover:text-orange-400 transition-colors text-sm">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Column */}
            <div className="space-y-6">
              <h4 className="font-heading font-bold text-white text-sm tracking-wider uppercase">Get In Touch</h4>
              <ul className="space-y-5">
                <li>
                  <a href="mailto:support@stickybanditos.com" className="flex items-center gap-3 text-gray-400 hover:text-orange-400 transition-colors group">
                    <div className="w-9 h-9 bg-gray-800 group-hover:bg-orange-500/20 rounded-lg flex items-center justify-center transition-colors">
                      <Mail className="w-4 h-4 text-orange-400" />
                    </div>
                    <span className="text-sm">support@stickybanditos.com</span>
                  </a>
                </li>
                <li>
                  <a href="tel:5551234567" className="flex items-center gap-3 text-gray-400 hover:text-orange-400 transition-colors group">
                    <div className="w-9 h-9 bg-gray-800 group-hover:bg-orange-500/20 rounded-lg flex items-center justify-center transition-colors">
                      <Phone className="w-4 h-4 text-orange-400" />
                    </div>
                    <span className="text-sm">(555) 123-4567</span>
                  </a>
                </li>
                <li>
                  <div className="flex items-start gap-3 text-gray-400">
                    <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-orange-400" />
                    </div>
                    <span className="text-sm leading-relaxed">123 Print Lane<br />Los Angeles, CA 90001</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="border-t border-gray-800 pt-10 pb-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <span className="text-white font-medium text-sm block">Premium Quality</span>
                <span className="text-gray-500 text-xs">Professional printing</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <span className="text-white font-medium text-sm block">Fast Shipping</span>
                <span className="text-gray-500 text-xs">3-5 business days</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <span className="text-white font-medium text-sm block">Satisfaction Guaranteed</span>
                <span className="text-gray-500 text-xs">100% money back</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Sticky Banditos Printing Company. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/" className="text-gray-500 hover:text-orange-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/" className="text-gray-500 hover:text-orange-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
