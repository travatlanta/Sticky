import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">SB</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Sticky Banditos</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-600 hover:text-primary-500 font-medium">
              Products
            </Link>
            {isAuthenticated && (
              <Link href="/orders" className="text-gray-600 hover:text-primary-500 font-medium">
                My Orders
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/cart">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                )}
                <a href="/api/logout">
                  <Button variant="outline" size="sm">
                    Sign Out
                  </Button>
                </a>
              </div>
            ) : (
              <a href="/api/login">
                <Button>Sign In</Button>
              </a>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link
                href="/products"
                className="text-gray-600 hover:text-primary-500 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              {isAuthenticated && (
                <Link
                  href="/orders"
                  className="text-gray-600 hover:text-primary-500 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
              )}
              <Link
                href="/cart"
                className="text-gray-600 hover:text-primary-500 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cart
              </Link>
              {isAuthenticated ? (
                <a href="/api/logout" className="text-gray-600 hover:text-primary-500 font-medium">
                  Sign Out
                </a>
              ) : (
                <a href="/api/login" className="text-primary-500 font-medium">
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
