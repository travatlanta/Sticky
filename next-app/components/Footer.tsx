'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <Image
                src="/logo.png"
                alt="Sticky Banditos"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <span className="font-display font-bold text-xl text-white">Sticky Banditos</span>
            </Link>
            <p className="text-gray-400 text-sm">
              Premium custom printing for stickers, labels, and more. 
              High-quality materials, fast turnaround.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Products</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-orange-400 transition-colors">All Products</Link></li>
              <li><Link href="/products?category=stickers" className="hover:text-orange-400 transition-colors">Custom Stickers</Link></li>
              <li><Link href="/products?category=labels" className="hover:text-orange-400 transition-colors">Labels</Link></li>
              <li><Link href="/deals" className="hover:text-orange-400 transition-colors">Deals</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="hover:text-orange-400 transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-orange-400 transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-orange-400 transition-colors">Shipping Info</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login" className="hover:text-orange-400 transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-orange-400 transition-colors">Create Account</Link></li>
              <li><Link href="/orders" className="hover:text-orange-400 transition-colors">Order History</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Sticky Banditos. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
