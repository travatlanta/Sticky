import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Truck, Shield, Palette, Sticker, CreditCard, FileImage, Star, Flame, Layers, Tag, Wine, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";

export default function Landing() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: homepageDeals } = useQuery<any[]>({
    queryKey: ["/api/deals/homepage"],
  });

  const { data: allProducts } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: featuredProducts } = useQuery<any[]>({
    queryKey: ["/api/products?featured=true"],
  });

  const stickers = allProducts?.filter((p: any) => p.categoryId === 1)?.slice(0, 6) || [];

  return (
    <>
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-50 -z-10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-300/30 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl -z-10" />
        
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-orange-200 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Premium Quality Printing</span>
            </div>
            
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-gray-900 mb-6 leading-tight">
              {isAuthenticated ? (
                <>
                  Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-red-500">
                    Let's Create
                  </span>
                </>
              ) : (
                <>
                  Custom Printing
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-red-500">
                    Made Easy
                  </span>
                </>
              )}
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
              From stickers to business cards, create stunning custom prints with our
              easy-to-use design editor. Premium quality, fast delivery.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30" data-testid="button-browse-products">
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              {isAuthenticated ? (
                <Link href="/account">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-orange-300 hover:bg-orange-50" data-testid="button-my-account">
                    My Account
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-orange-300 hover:bg-orange-50" data-testid="button-sign-in">
                    Sign In to Start
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Palette className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-heading text-xl mb-2 text-gray-900">Easy Design Editor</h3>
              <p className="text-gray-600">Create custom designs with our intuitive online editor</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-heading text-xl mb-2 text-gray-900">Premium Quality</h3>
              <p className="text-gray-600">High-quality materials and vibrant, long-lasting prints</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Truck className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-heading text-xl mb-2 text-gray-900">Fast Shipping</h3>
              <p className="text-gray-600">Quick turnaround and reliable delivery to your door</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-heading text-xl mb-2 text-gray-900">Satisfaction Guarantee</h3>
              <p className="text-gray-600">100% satisfaction or your money back</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOT DEALS Section */}
      {homepageDeals && homepageDeals.length > 0 && (
        <section className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 py-12 px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-4 right-20 w-48 h-48 bg-white rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto relative">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mx-auto mb-3">
                <Flame className="h-7 w-7 text-white" />
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-white mb-1">Hot Deals</h2>
              <p className="text-white/80 text-sm md:text-base mb-4">Limited time offers - don't miss out!</p>
              <Link href="/deals">
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur" data-testid="button-shop-all-deals">
                  Shop All Deals <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {homepageDeals.map((deal: any) => {
                const badgeColors: Record<string, string> = {
                  yellow: "bg-yellow-500 text-black",
                  red: "bg-red-500 text-white",
                  green: "bg-green-500 text-white",
                  purple: "bg-purple-500 text-white",
                  blue: "bg-blue-500 text-white",
                  orange: "bg-orange-500 text-white",
                };
                const percentOff = deal.originalPrice 
                  ? Math.round((1 - deal.dealPrice / deal.originalPrice) * 100)
                  : 0;
                
                return (
                  <Card key={deal.id} className="overflow-hidden shadow-xl hover:shadow-2xl transition-shadow" data-testid={`deal-card-${deal.id}`}>
                    <div className="relative">
                      {deal.imageUrl ? (
                        <img 
                          src={deal.imageUrl} 
                          alt={deal.title}
                          className="w-full aspect-square object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                          <Flame className="h-16 w-16 text-orange-300" />
                        </div>
                      )}
                      {deal.badgeText && (
                        <Badge className={`absolute top-2 left-2 ${badgeColors[deal.badgeColor] || badgeColors.orange}`}>
                          {deal.badgeText}
                        </Badge>
                      )}
                      {percentOff > 0 && (
                        <Badge className="absolute top-2 right-2 bg-red-600 text-white">
                          {percentOff}% OFF
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 bg-white">
                      <h3 className="font-heading text-lg text-gray-900 mb-1">{deal.title}</h3>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{deal.description}</p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-2">
                          <span className="font-heading text-xl text-orange-600">{formatPrice(deal.dealPrice)}</span>
                          {deal.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">{formatPrice(deal.originalPrice)}</span>
                          )}
                        </div>
                        <Link href={deal.linkUrl || "/products"}>
                          <Button size="sm" data-testid={`deal-shop-${deal.id}`}>
                            {deal.ctaText || "Shop"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Custom Stickers Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-orange-50">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
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
                    >
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-orange-200 to-yellow-100 rounded-xl flex items-center justify-center mb-2 overflow-hidden">
                        {sticker.thumbnailUrl ? (
                          <img src={sticker.thumbnailUrl} alt={sticker.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Layers className="h-8 w-8 text-orange-500" />
                        )}
                      </div>
                      <p className="text-xs md:text-sm font-medium text-gray-800 text-center max-w-20 md:max-w-24 truncate">{sticker.name?.split(' ').slice(0, 2).join(' ')}</p>
                      <p className="text-xs text-orange-500 font-bold text-center">{formatPrice(sticker.basePrice)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
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
      </section>

      {/* Stickers Feature Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="pl-4 md:pl-8 lg:pl-12">
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
      </section>

      {/* Labels & Bottle Labels Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-orange-500/20 text-orange-400 mb-4">For Your Business</Badge>
            <h2 className="font-heading text-4xl text-white mb-4">Labels That Make An Impression</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Professional labels for products, packaging, and bottles. Perfect for small businesses, 
              craft breweries, candle makers, and more.
            </p>
          </div>

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
      </section>

      <section className="py-20 bg-gradient-to-br from-orange-50 via-yellow-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-4xl md:text-5xl text-gray-900 mb-4">Popular Products</h2>
            <p className="text-lg text-gray-600">Start creating with our most loved print products</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link href="/products" className="group">
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-orange-100 group-hover:-translate-y-2">
                <div className="w-32 h-32 bg-gradient-to-br from-pink-300 via-orange-300 to-yellow-300 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <Sticker className="h-16 w-16 text-white drop-shadow-md" />
                </div>
                <h3 className="font-heading text-2xl mb-2 text-gray-900">Custom Stickers</h3>
                <p className="text-gray-500 mb-4">Die-cut, kiss-cut, and sheet stickers</p>
                <p className="text-orange-500 font-bold text-lg">Starting at $4.99</p>
              </div>
            </Link>
            <Link href="/products" className="group">
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-blue-100 group-hover:-translate-y-2">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-300 via-indigo-300 to-purple-300 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <CreditCard className="h-16 w-16 text-white drop-shadow-md" />
                </div>
                <h3 className="font-heading text-2xl mb-2 text-gray-900">Business Cards</h3>
                <p className="text-gray-500 mb-4">Premium cardstock with custom finishes</p>
                <p className="text-orange-500 font-bold text-lg">Starting at $19.99</p>
              </div>
            </Link>
            <Link href="/products" className="group">
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center border border-green-100 group-hover:-translate-y-2">
                <div className="w-32 h-32 bg-gradient-to-br from-green-300 via-teal-300 to-cyan-300 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <FileImage className="h-16 w-16 text-white drop-shadow-md" />
                </div>
                <h3 className="font-heading text-2xl mb-2 text-gray-900">Flyers & Posters</h3>
                <p className="text-gray-500 mb-4">Eye-catching prints in any size</p>
                <p className="text-orange-500 font-bold text-lg">Starting at $9.99</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 rounded-3xl p-12 text-center text-white shadow-xl">
            <div className="flex justify-center gap-1 mb-4">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className="h-6 w-6 fill-yellow-300 text-yellow-300" />
              ))}
            </div>
            <h2 className="font-heading text-3xl md:text-4xl mb-4">Trusted by Thousands of Happy Customers</h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Join our community of creators and businesses who trust Sticky Banditos for their printing needs.
            </p>
            <Link href="/products">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
