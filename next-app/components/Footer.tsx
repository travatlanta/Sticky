'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MapPin, Mail, Phone, Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300">
      <div className="container mx-auto px-4">
        <div className="py-12 md:py-16">
          <div className="flex flex-col items-center text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="Sticky Banditos"
                  width={56}
                  height={56}
                  className="rounded-lg"
                />
              </div>
              <span className="font-display font-bold text-xl text-white group-hover:text-orange-400 transition-colors">
                Sticky Banditos
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              Premium custom stickers and labels. High-quality materials, fast turnaround, exceptional service.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-10">
            <div className="text-center">
              <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
                Products
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/products" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=stickers" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    Custom Stickers
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=labels" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    Labels
                  </Link>
                </li>
                <li>
                  <Link href="/deals" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    Hot Deals
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="text-center">
              <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
                Support
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link href="/refunds" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="text-center">
              <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
                Account
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    Order History
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                    My Cart
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="text-center">
              <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
                Contact
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <span>Phoenix, AZ 85009</span>
                </li>
                <li className="text-sm text-gray-400">
                  2 North 35th Ave
                </li>
                <li>
                  <a href="mailto:info@stickybanditos.com" className="text-sm text-gray-400 hover:text-orange-400 transition-colors flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    Email Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <a 
              href="#" 
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-orange-500 flex items-center justify-center transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-orange-500 flex items-center justify-center transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-orange-500 flex items-center justify-center transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
        
        <div className="border-t border-gray-800/60">
          <div className="py-6 flex flex-col items-center gap-4">
            <nav className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs text-gray-500">
              <Link href="/terms" className="hover:text-orange-400 transition-colors">Terms of Service</Link>
              <span className="text-gray-700">|</span>
              <Link href="/privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link>
              <span className="text-gray-700">|</span>
              <Link href="/refunds" className="hover:text-orange-400 transition-colors">Refund Policy</Link>
            </nav>
            <p className="text-xs text-gray-500 text-center">
              &copy; {new Date().getFullYear()} Sticky Banditos LLC. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
