import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-orange-100 mb-4 md:mb-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-shadow">
              <span className="text-white font-bold text-xl">SB</span>
            </div>
            <span className="font-heading font-bold text-xl text-gray-900">Sticky Banditos</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">
              Products
            </Link>
            {isAuthenticated && (
              <Link href="/orders" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">
                My Orders
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-orange-500 hover:bg-orange-50">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-200"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center ring-2 ring-orange-200">
                    <User className="h-4 w-4 text-orange-600" />
                  </div>
                )}
                <a href="/api/logout">
                  <Button variant="outline" size="sm" className="border-orange-200 hover:bg-orange-50 hover:border-orange-300">
                    Sign Out
                  </Button>
                </a>
              </div>
            ) : (
              <a href="/api/login">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/30">
                  Sign In
                </Button>
              </a>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-600 hover:text-orange-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
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
                className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cart
              </Link>
              {isAuthenticated ? (
                <a href="/api/logout" className="text-gray-600 hover:text-orange-500 font-medium transition-colors">
                  Sign Out
                </a>
              ) : (
                <a href="/api/login" className="text-orange-500 font-bold transition-colors">
                  Sign In
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
