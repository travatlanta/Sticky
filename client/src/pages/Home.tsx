import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ArrowRight, Plus, Package, FileText, Sparkles, Zap, Percent, Clock, Star, Layers, Image, FileImage, Flame, Wine, Tag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();

  const { data: products } = useQuery({
    queryKey: ["/api/products?featured=true"],
  });

  const { data: allProducts } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: designs } = useQuery({
    queryKey: ["/api/designs"],
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Get products by category for creative displays
  const stickers = allProducts?.filter((p: any) => p.categoryId === 1)?.slice(0, 6) || [];
  const flyers = allProducts?.filter((p: any) => p.categoryId === 2)?.slice(0, 3) || [];
  const posters = allProducts?.filter((p: any) => p.categoryId === 6)?.slice(0, 4) || [];

  return (
    <div className="min-h-screen pb-16 md:pb-20">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-white py-8 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white border border-orange-200 rounded-full px-4 py-2 mb-4">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Welcome back!</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-gray-900 mb-2">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">{user?.firstName || "there"}</span>!
            </h1>
            <p className="text-lg text-gray-600">Ready to create something awesome?</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Link href="/products">
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-orange-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
                  <Plus className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-heading text-xl mb-1 text-gray-900">New Order</h3>
                <p className="text-gray-500">Browse products and start designing</p>
              </div>
            </Link>
            <Link href="/orders">
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                  <Package className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-heading text-xl mb-1 text-gray-900">My Orders</h3>
                <p className="text-gray-500">
                  {orders?.length || 0} orders
                </p>
              </div>
            </Link>
            <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-transparent">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-heading text-xl mb-1 text-gray-900">Saved Designs</h3>
              <p className="text-gray-500">
                {designs?.length || 0} designs saved
              </p>
            </div>
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
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-heading text-3xl text-white">Hot Deals</h2>
              <p className="text-white/80 text-sm">Limited time offers - don't miss out!</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Deal 1 - Stickers */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <Badge className="bg-yellow-400 text-yellow-900 font-bold">20% OFF</Badge>
                <div className="flex items-center gap-1 text-white/70 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>3 days left</span>
                </div>
              </div>
              <div className="h-32 flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-300 to-yellow-300 rounded-xl rotate-12 absolute -left-4 -top-2 shadow-lg" />
                  <div className="w-20 h-20 bg-gradient-to-br from-red-300 to-orange-300 rounded-xl -rotate-6 absolute left-4 top-2 shadow-lg" />
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-amber-300 rounded-full relative shadow-lg flex items-center justify-center">
                    <Layers className="h-8 w-8 text-amber-700" />
                  </div>
                </div>
              </div>
              <h3 className="font-heading text-xl text-white mb-2">Sticker Bundle</h3>
              <p className="text-white/70 text-sm mb-4">Order 500+ stickers and save big!</p>
              <div className="flex items-center gap-2">
                <span className="text-white/50 line-through text-lg">$125</span>
                <span className="text-white font-bold text-2xl">$99</span>
              </div>
              <Link href="/products">
                <Button className="w-full mt-4 bg-white text-orange-600 hover:bg-white/90">
                  Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Deal 2 - Business Cards */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <Badge className="bg-green-400 text-green-900 font-bold">FREE SHIPPING</Badge>
                <div className="flex items-center gap-1 text-white/70 text-sm">
                  <Zap className="h-4 w-4" />
                  <span>Popular</span>
                </div>
              </div>
              <div className="h-32 flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="w-28 h-16 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg rotate-6 absolute -top-2 shadow-xl border border-white/10" />
                  <div className="w-28 h-16 bg-gradient-to-r from-white to-gray-100 rounded-lg -rotate-3 relative shadow-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-4 h-4 bg-orange-500 rounded-full mx-auto mb-1" />
                      <div className="w-12 h-1 bg-gray-300 rounded mx-auto" />
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="font-heading text-xl text-white mb-2">Business Cards</h3>
              <p className="text-white/70 text-sm mb-4">500 premium cards + free shipping</p>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-2xl">From $49</span>
              </div>
              <Link href="/products">
                <Button className="w-full mt-4 bg-white text-orange-600 hover:bg-white/90">
                  Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Deal 3 - First Order */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <Badge className="bg-purple-400 text-purple-900 font-bold">NEW CUSTOMER</Badge>
                <div className="flex items-center gap-1 text-white/70 text-sm">
                  <Star className="h-4 w-4" />
                  <span>Exclusive</span>
                </div>
              </div>
              <div className="h-32 flex items-center justify-center mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-xl">
                  <Percent className="h-12 w-12 text-white" />
                </div>
              </div>
              <h3 className="font-heading text-xl text-white mb-2">First Order Deal</h3>
              <p className="text-white/70 text-sm mb-4">15% off your entire first order!</p>
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-sm">Use code:</span>
                <span className="text-white font-bold text-lg bg-white/20 px-3 py-1 rounded">WELCOME15</span>
              </div>
              <Link href="/products">
                <Button className="w-full mt-4 bg-white text-orange-600 hover:bg-white/90">
                  Start Shopping <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Creative Stickers Section */}
      <div className="py-16 px-4 bg-gradient-to-b from-white to-orange-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-3xl text-gray-900">Custom Stickers</h2>
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
              {stickers.slice(0, 6).map((sticker: any, i: number) => {
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
                <h3 className="font-heading text-xl md:text-3xl text-gray-900 mb-1">Die-Cut, Circles, Sheets & More</h3>
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

      {/* Flyers Section - Stack Display */}
      <div className="py-16 px-4 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-orange-100 text-orange-700 mb-4">Premium Quality</Badge>
              <h2 className="font-heading text-4xl text-gray-900 mb-4">Stickers That Stick</h2>
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
                {/* Background sticker - circle */}
                <div className="absolute w-32 h-32 bg-gradient-to-br from-red-400 to-orange-400 rounded-full shadow-2xl transform rotate-12 translate-x-16 translate-y-8" />
                {/* Middle sticker - square */}
                <div className="absolute w-36 h-36 bg-gradient-to-br from-yellow-300 to-orange-300 rounded-2xl shadow-2xl transform -rotate-12 -translate-x-12 -translate-y-4" />
                {/* Front sticker - main display */}
                <div className="absolute w-56 h-56 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col items-center justify-center p-6 transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300">
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-yellow-50 rounded-xl flex items-center justify-center mb-4">
                    <Layers className="h-16 w-16 text-orange-400" />
                  </div>
                  <div className="text-center">
                    <span className="text-orange-500 font-bold text-lg">From $0.08/sticker</span>
                  </div>
                </div>
                {/* Small accent sticker */}
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
            <h2 className="font-heading text-4xl text-white mb-4">Labels That Make An Impression</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Professional labels for products, packaging, and bottles. Perfect for small businesses, 
              craft breweries, candle makers, and more.
            </p>
          </div>

          {/* Labels Display */}
          <div className="relative h-80 md:h-96 mb-8">
            <div className="absolute inset-0 flex items-center justify-center gap-4 md:gap-6">
              {/* Product Labels */}
              <Link href="/products?category=labels" className="transform hover:scale-105 transition-all duration-300 hover:z-10">
                <div className="w-32 h-40 md:w-40 md:h-52 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-2xl flex flex-col items-center justify-center p-3 border-4 border-white/10">
                  <Tag className="h-8 w-8 md:h-12 md:w-12 text-white/80 mb-2" />
                  <span className="text-white font-bold text-sm">Product Labels</span>
                  <span className="text-white/70 text-xs mt-1">Custom sizes</span>
                </div>
              </Link>
              
              {/* Bottle Labels - Center */}
              <Link href="/products?category=bottle-labels" className="transform hover:scale-105 transition-all duration-300 hover:z-10">
                <div className="w-44 h-56 md:w-56 md:h-72 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-2xl flex flex-col items-center justify-center p-4 border-4 border-white/20 relative">
                  <Badge className="absolute -top-3 bg-yellow-400 text-yellow-900">Popular</Badge>
                  <Wine className="h-12 w-12 md:h-16 md:w-16 text-white/80 mb-3" />
                  <span className="text-white font-bold text-lg">Bottle Labels</span>
                  <span className="text-white/70 text-sm mt-1">Wine, Beer, Candles</span>
                </div>
              </Link>
              
              {/* Packaging Labels */}
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
              <Button size="lg" variant="outline" className="border-white/30 text-white">
                Shop Bottle Labels <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="py-16 px-4 bg-gradient-to-b from-white to-orange-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-3xl text-gray-900">Featured Products</h2>
            <Link href="/products">
              <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {products && products.length > 0 ? (
            <div className="grid md:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product: any) => (
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
                        <Package className="h-12 w-12 text-orange-400" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading text-lg text-gray-900">{product.name}</h3>
                      <p className="text-orange-500 font-bold mt-1">
                        From {formatPrice(product.basePrice)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-orange-100">
              <Package className="h-16 w-16 text-orange-300 mx-auto mb-4" />
              <p className="text-gray-500">No products available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
