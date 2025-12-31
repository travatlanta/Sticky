"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Flame, ArrowLeft, Clock, Tag } from "lucide-react";

interface Deal {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  originalPrice: string | null;
  dealPrice: string;
  quantity: number | null;
  productSize: string | null;
  productType: string | null;
  linkUrl: string | null;
  badgeText: string | null;
  badgeColor: string | null;
  ctaText: string | null;
  endsAt: string | null;
}

export default function Deals() {
  const { data: deals, isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const badgeColors: Record<string, string> = {
    yellow: "bg-yellow-500 text-black",
    red: "bg-red-500 text-white",
    green: "bg-green-500 text-white",
    purple: "bg-purple-500 text-white",
  };

  return (
    <div className="min-h-screen pb-16 md:pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-4 right-20 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto relative">
          <Link href="/">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 mb-4" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <Flame className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-4xl md:text-5xl text-white">Hot Deals</h1>
              <p className="text-white/80 text-lg">Grab these limited-time offers before they&apos;re gone!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="py-12 px-4 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : !deals || deals.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Tag className="h-10 w-10 text-orange-400" />
              </div>
              <h2 className="font-heading text-2xl text-gray-900 mb-2">No Active Deals</h2>
              <p className="text-gray-500 mb-6">Check back soon for amazing offers!</p>
              <Link href="/products">
                <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-browse-products">
                  Browse Products
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-8">
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  {deals.length} Active Deal{deals.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.map((deal) => {
                  // Build URL with deal parameters for fixed quantity
                  const baseUrl = deal.linkUrl || "/products";
                  const separator = baseUrl.includes('?') ? '&' : '?';
                  const dealUrl = deal.quantity 
                    ? `${baseUrl}${separator}dealId=${deal.id}&qty=${deal.quantity}&price=${deal.dealPrice}`
                    : baseUrl;
                  return (
                  <Link key={deal.id} href={dealUrl} data-testid={`deal-card-${deal.id}`}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-orange-100 hover:border-orange-200">
                      <div className="relative aspect-square">
                        {deal.imageUrl ? (
                          <img 
                            src={deal.imageUrl} 
                            alt={deal.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center">
                            <Flame className="h-20 w-20 text-orange-400" />
                          </div>
                        )}
                        {deal.badgeText && (
                          <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg ${badgeColors[deal.badgeColor || 'yellow'] || badgeColors.yellow}`}>
                            {deal.badgeText}
                          </div>
                        )}
                        {deal.originalPrice && parseFloat(deal.originalPrice) > parseFloat(deal.dealPrice) && (
                          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                            {Math.round((1 - parseFloat(deal.dealPrice) / parseFloat(deal.originalPrice)) * 100)}% OFF
                          </div>
                        )}
                      </div>
                      <div className="p-5 space-y-3">
                        <h3 className="font-heading text-xl line-clamp-2 text-gray-900">{deal.title}</h3>
                        {deal.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">{deal.description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {deal.quantity && (
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">{deal.quantity} pcs</Badge>
                          )}
                          {deal.productSize && (
                            <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">{deal.productSize}</Badge>
                          )}
                          {deal.productType && (
                            <Badge variant="outline" className="text-xs">{deal.productType}</Badge>
                          )}
                        </div>
                        {deal.endsAt && (
                          <div className="flex items-center gap-1.5 text-xs text-orange-600">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Ends {new Date(deal.endsAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            {deal.originalPrice && parseFloat(deal.originalPrice) > parseFloat(deal.dealPrice) && (
                              <span className="text-sm text-gray-400 line-through">
                                {formatPrice(parseFloat(deal.originalPrice))}
                              </span>
                            )}
                            <span className="text-2xl font-bold text-orange-600">
                              {formatPrice(parseFloat(deal.dealPrice))}
                            </span>
                          </div>
                          <Button className="bg-orange-500 hover:bg-orange-600">
                            Buy Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
