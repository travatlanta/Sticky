'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MapPin, Mail, Phone, ChevronRight, Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300">
      <div className="container mx-auto px-4">
        <div className="py-10 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="col-span-2 md:col-span-1 mb-4 md:mb-0">
              <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
                <div className="relative">
                  <Image
                    src="/logo.png"
                    alt="Sticky Banditos"
                    width={44}
                    height={44}
                    className="rounded-lg"
                  />
                </div>
                <span className="font-display font-bold text-lg text-white group-hover:text-orange-400 transition-colors">
                  Sticky Banditos
                </span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed mb-5 max-w-xs">
                Premium custom printing for stickers, labels, and more. 
                High-quality materials, fast turnaround.
              </p>
              <div className="flex items-start gap-2.5 text-sm text-gray-400">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-orange-500" />
                <span className="leading-relaxed">
                  2 North 35th Ave<br />
                  Phoenix, AZ 85009
                </span>
              </div>
              
              <div className="flex items-center gap-3 mt-6">
                <a 
                  href="#" 
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-orange-500 flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a 
                  href="#" 
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-orange-500 flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a 
                  href="#" 
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-orange-500 flex items-center justify-center transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
                Products
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/products" className="text-sm text-gray-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=stickers" className="text-sm text-gray-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Custom Stickers
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=labels" className="text-sm text-gray-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Labels
                  </Link>
                </li>
                <li>
                  <Link href="/deals" className="text-sm text-gray-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Hot Deals
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
                Support
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/contact" className="text-sm text-gray-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-sm text-gray-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="text-sm text-gray-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Shipping Info
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
                Account
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/login" className="text-sm text-gray-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-sm text-gray-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="text-sm text-gray-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1 group">
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Order History
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800/60">
          <div className="py-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500 text-center md:text-left">
              &copy; {new Date().getFullYear()} Sticky Banditos LLC. All rights reserved.
            </p>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs text-gray-500">
              <Link href="/terms" className="hover:text-orange-400 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-orange-400 transition-colors">Privacy</Link>
              <Link href="/refunds" className="hover:text-orange-400 transition-colors">Refunds</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
