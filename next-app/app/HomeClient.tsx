'use client';


import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { ArrowRight, Plus, Sparkles, Star, Layers, Flame, Wine, Tag, Package } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  slug: string;
  basePrice: string;
  thumbnailUrl?: string;
  categoryId: number;
  featured?: boolean;
}

interface Deal {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  dealPrice: string;
  originalPrice?: string;
  linkUrl?: string;
  ctaText?: string;
  badgeText?: string;
  badgeColor?: string;
  quantity?: number;
  productSize?: string;
  productType?: string;
}

export default function HomePage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [homepageDeals, setHomepageDeals] = useState<Deal[]>([]);

  useEffect(() => {
    fetch('/api/products?featured=true')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(console.error);

    fetch('/api/products')
      .then(res => res.json())
      .then(data => setAllProducts(data))
      .catch(console.error);

    fetch('/api/deals/homepage')
      .then(res => res.json())
      .then(data => setHomepageDeals(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const stickers = allProducts.filter((p) => p.categoryId === 1).slice(0, 6);
  const userName = session?.user?.name?.split(' ')[0] || 'there';

  const badgeColors: Record<string, string> = {
    yellow: "bg-yellow-500 text-black",
    red: "bg-red-500 text-white",
    green: "bg-green-500 text-white",
    purple: "bg-purple-500 text-white",
  };

  return (
    <div className="min-h-screen pb-16 md:pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-400 py-12 md:py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-yellow-300 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-300 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto relative text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </div>
          <h1 className="font-bold text-4xl md:text-6xl text-white mb-3">
            Welcome back, {userName}!
          </h1>
          <p className="text-white/90 text-lg md:text-xl mb-6 max-w-xl mx-auto">
            Create stunning custom stickers, labels, and more for your brand
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/products">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-white/90 shadow-lg w-full sm:w-auto" data-testid="button-start-designing">
                <Plus className="mr-2 h-5 w-5" />
                Start Designing
              </Button>
            </Link>
            <Link href="/account">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur w-full sm:w-auto" data-testid="button-view-account">
                My Account <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* HOT DEALS Section */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-4 right-20 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto relative">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mx-auto mb-3">
              <Flame className="h-7 w-7 text-white" />
            </div>
            <h2 className="font-bold text-3xl md:text-4xl text-white mb-1">Hot Deals</h2>
            <p className="text-white/80 text-sm md:text-base mb-4">Limited time offers - don&apos;t miss out!</p>
            <Link href="/deals">
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur" data-testid="button-shop-all-deals">
                Shop All Deals <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {homepageDeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {homepageDeals.map((deal) => (
                <Link key={deal.id} href={deal.linkUrl || "/products"} data-testid={`deal-card-${deal.id}`}>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="relative aspect-square">
                      {deal.imageUrl ? (
                        <img 
                          src={deal.imageUrl} 
                          alt={deal.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                          <Flame className="h-16 w-16 text-orange-400" />
                        </div>
                      )}
                      {deal.badgeText && (
                        <div className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-bold ${badgeColors[deal.badgeColor || 'yellow']}`}>
                          {deal.badgeText}
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-lg line-clamp-1 text-gray-900">{deal.title}</h3>
                      {deal.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">{deal.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {deal.quantity && (
                          <Badge variant="secondary" className="text-xs">{deal.quantity} pcs</Badge>
                        )}
                        {deal.productSize && (
                          <Badge variant="secondary" className="text-xs">{deal.productSize}</Badge>
                        )}
                        {deal.productType && (
                          <Badge variant="outline" className="text-xs">{deal.productType}</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 gap-2">
                        <div className="flex items-center gap-2">
                          {deal.originalPrice && parseFloat(deal.originalPrice) > parseFloat(deal.dealPrice) && (
                            <span className="text-sm text-gray-400 line-through">
                              {formatPrice(parseFloat(deal.originalPrice))}
                            </span>
                          )}
                          <span className="text-xl font-bold text-orange-600">
                            {formatPrice(parseFloat(deal.dealPrice))}
                          </span>
                        </div>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                          {deal.ctaText || "Shop Now"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Link href="/products" data-testid="deal-100-3in">
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="aspect-square bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                    <Flame className="h-20 w-20 text-orange-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900">100 3-inch Stickers</h3>
                    <div className="flex items-center justify-between pt-2 gap-2">
                      <span className="text-xl font-bold text-orange-600">$29.00</span>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">Shop Now</Button>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/products" data-testid="deal-150-1in">
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="aspect-square bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                    <Flame className="h-20 w-20 text-orange-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900">150 1-inch Stickers</h3>
                    <div className="flex items-center justify-between pt-2 gap-2">
                      <span className="text-xl font-bold text-orange-600">$40.00</span>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">Shop Now</Button>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/products" data-testid="deal-200-3in">
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="aspect-square bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                    <Flame className="h-20 w-20 text-orange-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900">200 3-inch Die-Cut</h3>
                    <div className="flex items-center justify-between pt-2 gap-2">
                      <span className="text-xl font-bold text-orange-600">$59.00</span>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">Shop Now</Button>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Creative Stickers Section */}
      <div className="py-16 px-4 bg-gradient-to-b from-white to-orange-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h2 className="font-bold text-3xl text-gray-900">Custom Stickers</h2>
              <p className="text-gray-600 mt-1">Stick it anywhere. Make it yours.</p>
            </div>
            <Link href="/products?category=stickers">
              <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Scattered Sticker Display */}
          <div className="relative h-80 md:h-96 bg-gradient-to-br from-orange-100 via-yellow-50 to-red-50 rounded-3xl overflow-hidden mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              {stickers.map((sticker, i) => {
                const positions = [
                  { top: '10%', left: '5%', rotate: '-15deg', scale: '1' },
                  { top: '60%', left: '8%', rotate: '10deg', scale: '0.9' },
                  { top: '20%', left: '35%', rotate: '5deg', scale: '1.1' },
                  { top: '55%', left: '40%', rotate: '-8deg', scale: '0.85' },
                  { top: '15%', right: '10%', rotate: '12deg', scale: '1' },
                  { top: '60%', right: '5%', rotate: '-5deg', scale: '0.95' },
                ];
                const pos = positions[i] || positions[0];
                return (
                  <Link key={sticker.id} href={`/products/${sticker.slug}`}>
                    <div
                      className="absolute bg-white rounded-2xl p-3 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer border-2 border-orange-100 hover:border-orange-300"
                      style={{
                        top: pos.top,
                        left: pos.left,
                        right: pos.right,
                        transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                      }}
                      data-testid={`sticker-card-${sticker.id}`}
                    >
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-orange-200 to-yellow-100 rounded-xl flex items-center justify-center mb-2 overflow-hidden">
                        {sticker.thumbnailUrl ? (
                          <img src={sticker.thumbnailUrl} alt={sticker.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Layers className="h-8 w-8 text-orange-500" />
                        )}
                      </div>
                      <p className="text-xs md:text-sm font-medium text-gray-800 text-center max-w-20 md:max-w-24 truncate">{sticker.name.split(' ').slice(0, 2).join(' ')}</p>
                      <p className="text-xs text-orange-500 font-bold text-center">{formatPrice(sticker.basePrice)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
            {/* Center CTA */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center pointer-events-auto bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-5 md:px-8 md:py-6 shadow-xl mx-4">
                <h3 className="font-bold text-xl md:text-3xl text-gray-900 mb-1">Die-Cut, Circles, Sheets & More</h3>
                <p className="text-gray-600 text-sm md:text-base mb-4">Starting at just $0.06/sticker</p>
                <Link href="/products?category=stickers">
                  <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg">
                    Design Your Stickers <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stickers Quality Section */}
      <div className="py-16 px-4 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="pl-4 md:pl-8 lg:pl-12">
              <Badge className="bg-orange-100 text-orange-700 mb-4">Premium Quality</Badge>
              <h2 className="font-bold text-4xl text-gray-900 mb-4">Stickers That Stick</h2>
              <p className="text-gray-600 text-lg mb-6">
                From branding to personal expression, our vibrant custom stickers make your designs pop. 
                Available in any shape or size with weatherproof options.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Star className="h-3 w-3 text-green-600" />
                  </div>
                  Full-color, high-resolution printing
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Star className="h-3 w-3 text-green-600" />
                  </div>
                  Premium vinyl & matte finishes
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Star className="h-3 w-3 text-green-600" />
                  </div>
                  Waterproof & UV resistant
                </li>
              </ul>
              <Link href="/products?category=stickers">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600">
                  Browse Stickers <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            {/* Stacked Stickers Visual */}
            <div className="relative h-80 md:h-96">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-32 h-32 bg-gradient-to-br from-red-400 to-orange-400 rounded-full shadow-2xl transform rotate-12 translate-x-16 translate-y-8" />
                <div className="absolute w-36 h-36 bg-gradient-to-br from-yellow-300 to-orange-300 rounded-2xl shadow-2xl transform -rotate-12 -translate-x-12 -translate-y-4" />
                <div className="absolute w-56 h-56 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col items-center justify-center p-6 transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300">
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-yellow-50 rounded-xl flex items-center justify-center mb-4">
                    <Layers className="h-16 w-16 text-orange-400" />
                  </div>
                  <div className="text-center">
                    <span className="text-orange-500 font-bold text-lg">From $0.08/sticker</span>
                  </div>
                </div>
                <div className="absolute w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-xl shadow-xl transform rotate-45 translate-x-24 -translate-y-16" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Labels & Bottle Labels Section */}
      <div className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-orange-500/20 text-orange-400 mb-4">For Your Business</Badge>
            <h2 className="font-bold text-4xl text-white mb-4">Labels That Make An Impression</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Professional labels for products, packaging, and bottles. Perfect for small businesses, 
              craft breweries, candle makers, and more.
            </p>
          </div>

          {/* Labels Display */}
          <div className="relative h-80 md:h-96 mb-8">
            <div className="absolute inset-0 flex items-center justify-center gap-4 md:gap-6">
              <Link href="/products?category=labels" className="transform hover:scale-105 transition-all duration-300 hover:z-10">
                <div className="w-32 h-40 md:w-40 md:h-52 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-2xl flex flex-col items-center justify-center p-3 border-4 border-white/10">
                  <Tag className="h-8 w-8 md:h-12 md:w-12 text-white/80 mb-2" />
                  <span className="text-white font-bold text-sm">Product Labels</span>
                  <span className="text-white/70 text-xs mt-1">Custom sizes</span>
                </div>
              </Link>
              
              <Link href="/products?category=bottle-labels" className="transform hover:scale-105 transition-all duration-300 hover:z-10">
                <div className="w-44 h-56 md:w-56 md:h-72 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-2xl flex flex-col items-center justify-center p-4 border-4 border-white/20 relative">
                  <Badge className="absolute -top-3 bg-yellow-400 text-yellow-900">Popular</Badge>
                  <Wine className="h-12 w-12 md:h-16 md:w-16 text-white/80 mb-3" />
                  <span className="text-white font-bold text-lg">Bottle Labels</span>
                  <span className="text-white/70 text-sm mt-1">Wine, Beer, Candles</span>
                </div>
              </Link>
              
              <Link href="/products?category=labels" className="transform hover:scale-105 transition-all duration-300 hover:z-10">
                <div className="w-32 h-40 md:w-40 md:h-52 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-2xl flex flex-col items-center justify-center p-3 border-4 border-white/10">
                  <Package className="h-8 w-8 md:h-12 md:w-12 text-white/80 mb-2" />
                  <span className="text-white font-bold text-sm">Packaging</span>
                  <span className="text-white/70 text-xs mt-1">Roll & Sheet</span>
                </div>
              </Link>
            </div>
          </div>

          <div className="text-center flex flex-wrap justify-center gap-4">
            <Link href="/products?category=labels">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500">
                Shop Labels <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/products?category=bottle-labels">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Shop Bottle Labels <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="py-16 px-4 bg-gradient-to-b from-white to-orange-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <h2 className="font-bold text-3xl text-gray-900">Featured Products</h2>
            <Link href="/products">
              <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid md:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div 
                    className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-orange-100"
                    data-testid={`product-card-${product.id}`}
                  >
                    <div className="aspect-square bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-50 flex items-center justify-center">
                      {product.thumbnailUrl ? (
                        <img
                          src={product.thumbnailUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Layers className="h-12 w-12 text-orange-300" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                      <p className="text-orange-600 font-bold mt-1">From {formatPrice(product.basePrice)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md border border-orange-100 animate-pulse">
                  <div className="aspect-square bg-gradient-to-br from-orange-100 to-yellow-50" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-2xl mb-4">STICKY BANDITOS</h3>
              <p className="text-gray-400">Premium custom stickers for everyone.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/deals" className="hover:text-white transition-colors">Deals</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link href="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/cart" className="hover:text-white transition-colors">Cart</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Sticky Banditos. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
