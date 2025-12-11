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

  const { data: homepageDeals } = useQuery<any[]>({
    queryKey: ["/api/deals/homepage"],
  });

  // Get products by category for creative displays
  const stickers = allProducts?.filter((p: any) => p.categoryId === 1)?.slice(0, 6) || [];
  const flyers = allProducts?.filter((p: any) => p.categoryId === 2)?.slice(0, 3) || [];
  const posters = allProducts?.filter((p: any) => p.categoryId === 6)?.slice(0, 4) || [];

  return (
    <div className="min-h-screen pb-16 md:pb-20">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 py-6 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-heading text-2xl md:text-3xl text-white">
                  Welcome back, {user?.firstName || "there"}!
                </h1>
                <p className="text-white/80 text-sm">Ready to create something awesome?</p>
              </div>
            </div>
            <Link href="/account">
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur" data-testid="button-view-account">
                My Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="py-8 px-4 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 max-w-2xl mx-auto">
            <Link href="/products">
              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-orange-300 text-center" data-testid="quick-action-new-order">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/30">
                  <Plus className="h-6 w-6 md:h-7 md:w-7 text-white" />
                </div>
                <h3 className="font-heading text-sm md:text-lg text-gray-900">New Order</h3>
              </div>
            </Link>
            <Link href="/orders">
              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-300 text-center" data-testid="quick-action-orders">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
                  <Package className="h-6 w-6 md:h-7 md:w-7 text-white" />
                </div>
                <h3 className="font-heading text-sm md:text-lg text-gray-900">My Orders</h3>
                <p className="text-xs md:text-sm text-gray-500">{orders?.length || 0} order{orders?.length !== 1 ? 's' : ''}</p>
              </div>
            </Link>
            <Link href="/designs">
              <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-300 text-center" data-testid="quick-action-designs">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/30">
                  <FileText className="h-6 w-6 md:h-7 md:w-7 text-white" />
                </div>
                <h3 className="font-heading text-sm md:text-lg text-gray-900">Designs</h3>
                <p className="text-xs md:text-sm text-gray-500">{designs?.length || 0} saved</p>
              </div>
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-heading text-3xl text-white">Hot Deals</h2>
                <p className="text-white/80 text-sm">Limited time offers - don't miss out!</p>
              </div>
            </div>
            <Link href="/deals">
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur" data-testid="button-shop-all-deals">
                Shop All Deals <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {homepageDeals && homepageDeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {homepageDeals.map((deal: any) => {
                const badgeColors: Record<string, string> = {
                  yellow: "bg-yellow-500 text-black",
                  red: "bg-red-500 text-white",
                  green: "bg-green-500 text-white",
                  purple: "bg-purple-500 text-white",
                };
                return (
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
                          <div className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-bold ${badgeColors[deal.badgeColor] || badgeColors.yellow}`}>
                            {deal.badgeText}
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="font-heading text-lg line-clamp-1 text-gray-900">{deal.title}</h3>
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
                        <div className="flex items-center justify-between pt-2">
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
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Fallback static deals if no dynamic deals */}
              <Link href="/products/die-cut-stickers-3x3" data-testid="deal-100-3in">
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="aspect-square">
                    <img 
                      src="/attached_assets/100_3_inch_stickers_deal_1765477482637.png" 
                      alt="100 3 inch stickers for $29" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading text-lg text-gray-900">100 3-inch Stickers</h3>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xl font-bold text-orange-600">$29.00</span>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">Shop Now</Button>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/products/die-cut-stickers-1x1" data-testid="deal-150-1in">
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="aspect-square">
                    <img 
                      src="/attached_assets/150_1_stickers_deal_1765477482637.png" 
                      alt="150 1 inch stickers for $40" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading text-lg text-gray-900">150 1-inch Stickers</h3>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xl font-bold text-orange-600">$40.00</span>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">Shop Now</Button>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/products/die-cut-stickers-3x3" data-testid="deal-200-3in">
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
                  <div className="aspect-square">
                    <img 
                      src="/attached_assets/300_Sticker_deal_1765477482637.png" 
                      alt="200 stickers 3 inch die cut for $59" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading text-lg text-gray-900">200 3-inch Die-Cut</h3>
                    <div className="flex items-center justify-between pt-2">
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
