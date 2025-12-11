import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Truck, Shield, Palette, Sticker, CreditCard, FileImage, Star, Flame } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";

export default function Landing() {
  const { user, isAuthenticated } = useAuth();
  
  const { data: homepageDeals } = useQuery<any[]>({
    queryKey: ["/api/deals/homepage"],
  });

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
                <a href="/api/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-orange-300 hover:bg-orange-50" data-testid="button-sign-in">
                    Sign In to Start
                  </Button>
                </a>
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
