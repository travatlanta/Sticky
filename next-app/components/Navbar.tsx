'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface CartItem {
  id: number;
  quantity: number;
}

interface CartData {
  items: CartItem[];
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const user = session?.user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: cartData } = useQuery<CartData>({
    queryKey: ['/api/cart'],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const cartItemCount = cartData?.items?.length || 0;

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-sm fixed top-0 left-0 right-0 z-50 border-b border-orange-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button
            className="md:hidden p-2 text-gray-600 hover:text-orange-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu-left"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <Link href="/" className="flex items-center space-x-2 group absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
            <Image
              src="/logo-icon.png"
              alt="Sticky Banditos"
              width={44}
              height={44}
              className="rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
            />
            <span className="font-display font-bold text-lg md:text-xl text-gray-900">Sticky Banditos</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">
              Products
            </Link>
            <Link href="/deals" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">
              Deals
            </Link>
            {isAuthenticated && (
              <Link href="/orders" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">
                My Orders
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50" data-testid="button-cart">
                <ShoppingCart className="h-5 w-5" />
              </Button>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" data-testid="cart-count">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link href="/account">
                  {(user as any)?.image ? (
                    <img
                      src={(user as any).image}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-200 cursor-pointer hover:ring-orange-400 transition-all"
                      data-testid="link-account-avatar"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center ring-2 ring-orange-200 cursor-pointer hover:ring-orange-400 transition-all" data-testid="link-account-avatar">
                      <User className="h-4 w-4 text-orange-600" />
                    </div>
                  )}
                </Link>
                {(user as any)?.isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="border-orange-200 hover:bg-orange-50">
                      Admin
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  data-testid="button-sign-out"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/30" data-testid="button-sign-in">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          <div className="md:hidden w-10"></div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-orange-100 bg-white/95">
            <div className="flex flex-col space-y-4">
              <Link
                href="/products"
                className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/deals"
                className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Deals
              </Link>
              {isAuthenticated && (
                <Link
                  href="/orders"
                  className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
              )}
              <Link
                href="/cart"
                className="text-gray-600 hover:text-orange-500 font-medium transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cart
                {cartItemCount > 0 && (
                  <span className="bg-orange-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/account"
                    className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  {(user as any)?.isAdmin && (
                    <Link
                      href="/admin"
                      className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-gray-600 hover:text-orange-500 font-medium transition-colors text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login" className="text-orange-500 font-bold transition-colors">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
