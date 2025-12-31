"use client";

import type { HomepageSettings } from "@/lib/homepage-settings";
import { 
  Palette, Sparkles, Truck, Shield, 
  Sticker, Tag, Wine, Package, Circle, Layers, Star
} from "lucide-react";

const iconMap: Record<string, any> = {
  Palette, Sparkles, Truck, Shield, 
  Sticker, Tag, Wine, Package, Circle, Layers
};

interface Product {
  id: number;
  name: string;
  basePrice: string;
  thumbnailUrl?: string;
}

interface SectionPreviewProps {
  section: string;
  settings: HomepageSettings;
  heroView?: "loggedIn" | "loggedOut";
  products?: Product[];
}

export default function SectionPreview({ section, settings, heroView = "loggedOut", products = [] }: SectionPreviewProps) {
  const renderHeroPreview = () => {
    const hero = heroView === "loggedIn" 
      ? settings?.hero?.loggedIn 
      : settings?.hero?.loggedOut;
    
    if (!hero) return <div className="p-8 text-gray-400 text-center">No hero data</div>;
    
    return (
      <div className="bg-gradient-to-br from-orange-100 via-white to-yellow-100 rounded-xl p-8 border-2 border-dashed border-orange-300 min-h-[280px] flex flex-col justify-center">
        <div className="text-center space-y-4">
          <span className="inline-block bg-orange-200 text-orange-800 text-xs px-3 py-1 rounded-full font-medium">
            {settings?.hero?.badge || "Badge"}
          </span>
          <div className="font-bold text-2xl md:text-3xl text-gray-900">
            {heroView === "loggedIn" ? (
              <>
                <span className="text-gray-600 text-base block mb-1">{(hero as any).welcomePrefix || ""}</span>
                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  {(hero as any).headline || "Headline"}
                </span>
              </>
            ) : (
              <>
                <span className="text-orange-500">{(hero as any).headlineTop || "Top"}</span>{" "}
                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  {(hero as any).headlineBottom || "Bottom"}
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600 max-w-md mx-auto line-clamp-3">{hero.description || ""}</p>
          <div className="flex gap-3 justify-center mt-4">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm px-5 py-2 rounded-lg font-medium shadow-md">
              {hero.primaryButtonText || "Button"}
            </span>
            <span className="border-2 border-gray-300 text-gray-700 text-sm px-5 py-2 rounded-lg font-medium">
              {hero.secondaryButtonText || "Button"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderFeaturesPreview = () => {
    const cards = settings?.features?.cards ?? [];
    
    if (cards.length === 0) {
      return <div className="p-8 text-gray-400 text-center">No feature cards</div>;
    }
    
    return (
      <div className="bg-white rounded-xl p-6 border min-h-[280px]">
        <h3 className="text-lg font-bold text-center text-gray-900 mb-6">Why Choose Us</h3>
        <div className="grid grid-cols-2 gap-4">
          {cards.map((card, i) => {
            const Icon = iconMap[card?.iconName] || Sparkles;
            return (
              <div key={i} className="bg-gray-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-orange-100 to-yellow-100 flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{card?.title || ""}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{card?.description || ""}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStickersPreview = () => {
    const stickers = settings?.customStickers;
    const stickersThatStick = settings?.stickersThatStick;
    const featuredIds = stickers?.featuredProductIds || [];
    const displayProducts = featuredIds.length > 0 
      ? featuredIds.map(id => products.find(p => p.id === id)).filter((p): p is Product => p !== undefined).slice(0, 6)
      : products.slice(0, 6);
    
    return (
      <div className="space-y-6 min-h-[400px]">
        <div className="bg-gradient-to-br from-orange-100 via-yellow-50 to-red-50 rounded-xl p-6 relative overflow-hidden">
          <div className="text-center mb-4">
            <h3 className="font-bold text-xl text-gray-900">{stickers?.title || "Custom Stickers"}</h3>
            <p className="text-sm text-gray-600">{stickers?.subtitle || ""}</p>
          </div>
          
          <div className="relative h-48 mb-4">
            {displayProducts.map((product, i) => {
              const positions = [
                { top: '0', left: '5%', rotate: '-12deg', zIndex: 1 },
                { top: '25%', left: '18%', rotate: '6deg', zIndex: 2 },
                { top: '55%', left: '2%', rotate: '-5deg', zIndex: 1 },
                { top: '5%', right: '5%', rotate: '10deg', zIndex: 1 },
                { top: '30%', right: '18%', rotate: '-8deg', zIndex: 2 },
                { top: '60%', right: '8%', rotate: '4deg', zIndex: 1 },
              ];
              const pos = positions[i] || positions[0];
              return (
                <div
                  key={product.id}
                  className="absolute bg-white rounded-lg p-2 shadow-lg border border-orange-100 hover:scale-105 transition-transform"
                  style={{
                    top: pos.top,
                    left: pos.left,
                    right: (pos as any).right,
                    transform: `rotate(${pos.rotate})`,
                    width: '80px',
                    zIndex: pos.zIndex,
                  }}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-yellow-50 rounded-lg flex items-center justify-center mx-auto mb-1">
                    {product.thumbnailUrl ? (
                      <img src={product.thumbnailUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Layers className="h-6 w-6 text-orange-400" />
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-gray-800 text-center truncate">{product.name.split(' ').slice(0, 2).join(' ')}</p>
                </div>
              );
            })}
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl px-6 py-4 shadow-xl text-center border border-orange-100">
                <p className="text-base font-bold text-gray-900">{stickers?.cardTitle || ""}</p>
                <p className="text-sm text-gray-600 mb-2">{stickers?.cardSubtitle || ""}</p>
                <span className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm px-4 py-2 rounded-lg font-medium">
                  {stickers?.buttonText || "Design"}
                </span>
              </div>
            </div>
          </div>
          
          {featuredIds.length > 0 && (
            <p className="text-xs text-blue-600 text-center font-medium">{featuredIds.length} featured product{featuredIds.length !== 1 ? 's' : ''} selected</p>
          )}
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-100">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <span className="inline-block bg-orange-200 text-orange-800 text-xs px-2 py-0.5 rounded-full mb-2">
                {stickersThatStick?.badge || "Premium Quality"}
              </span>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{stickersThatStick?.title || "Stickers That Stick"}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{stickersThatStick?.description || ""}</p>
              <ul className="space-y-1 mb-3">
                {(stickersThatStick?.features || []).slice(0, 3).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
                    <Star className="w-3 h-3 text-orange-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <span className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm px-4 py-1.5 rounded-lg">
                {stickersThatStick?.buttonText || "Browse Stickers"}
              </span>
            </div>
            <div className="w-32 h-32 bg-white rounded-xl shadow-lg flex items-center justify-center relative">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg flex items-center justify-center">
                <Sticker className="w-12 h-12 text-orange-400" />
              </div>
              <span className="absolute -bottom-2 text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                {stickersThatStick?.priceText || "From $0.10"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLabelsPreview = () => {
    const labels = settings?.labels;
    const cards = labels?.cards ?? [];
    
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 text-white min-h-[320px]">
        <div className="text-center mb-6">
          <span className="inline-block bg-orange-500/20 text-orange-300 text-xs px-3 py-1 rounded-full mb-3">
            {labels?.badge || "For Your Business"}
          </span>
          <h3 className="font-bold text-2xl mb-2">{labels?.title || "Labels That Make An Impression"}</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">{labels?.description || ""}</p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          {cards.map((card, i) => (
            <div 
              key={i} 
              className={`bg-gray-800/50 rounded-xl p-4 text-center border ${card?.isPopular ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-700'}`}
            >
              {card?.isPopular && (
                <span className="inline-block bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full mb-2">Popular</span>
              )}
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center mb-2">
                {i === 0 && <Tag className="w-6 h-6 text-orange-400" />}
                {i === 1 && <Wine className="w-6 h-6 text-orange-400" />}
                {i === 2 && <Package className="w-6 h-6 text-orange-400" />}
              </div>
              <p className="text-sm font-semibold">{card?.title || ""}</p>
              <p className="text-xs text-gray-500">{card?.subtitle || ""}</p>
            </div>
          ))}
        </div>
        
        <div className="flex gap-3 justify-center">
          <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm px-5 py-2 rounded-lg font-medium">
            {labels?.primaryButtonText || "Shop Labels"}
          </span>
          <span className="border border-gray-600 text-gray-300 text-sm px-5 py-2 rounded-lg">
            {labels?.secondaryButtonText || "Shop Bottle Labels"}
          </span>
        </div>
      </div>
    );
  };

  const renderPopularPreview = () => {
    const popular = settings?.popularProducts;
    const popularProducts = popular?.products ?? [];
    
    const gradients = [
      "from-orange-100 to-yellow-100",
      "from-blue-100 to-purple-100",
      "from-green-100 to-teal-100",
    ];
    
    return (
      <div className="bg-gray-50 rounded-xl p-8 border min-h-[320px]">
        <div className="text-center mb-6">
          <h3 className="font-bold text-2xl text-gray-900 mb-2">{popular?.title || "Popular Products"}</h3>
          <p className="text-sm text-gray-600">{popular?.subtitle || ""}</p>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {popularProducts.map((product, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border">
              <div className={`h-24 bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center`}>
                <div className="w-16 h-16 bg-white/80 rounded-lg flex items-center justify-center shadow-sm">
                  {i === 0 && <Sticker className="w-8 h-8 text-orange-500" />}
                  {i === 1 && <Circle className="w-8 h-8 text-blue-500" />}
                  {i === 2 && <Layers className="w-8 h-8 text-green-500" />}
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-gray-900 mb-1">{product?.title || ""}</p>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{product?.description || ""}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-orange-600">{product?.price || ""}</span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Shop</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCtaPreview = () => {
    const cta = settings?.cta;
    
    return (
      <div className="bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 rounded-xl p-10 text-white text-center min-h-[200px] flex flex-col justify-center">
        <h3 className="font-bold text-2xl md:text-3xl mb-3">{cta?.title || "Call to Action"}</h3>
        <p className="text-sm opacity-90 mb-6 max-w-lg mx-auto">{cta?.description || ""}</p>
        <div>
          <span className="inline-block bg-white text-orange-600 text-base px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow">
            {cta?.buttonText || "Button"}
          </span>
        </div>
      </div>
    );
  };

  const previews: Record<string, () => JSX.Element> = {
    hero: renderHeroPreview,
    features: renderFeaturesPreview,
    stickers: renderStickersPreview,
    labels: renderLabelsPreview,
    popular: renderPopularPreview,
    cta: renderCtaPreview,
  };

  if (!previews[section]) return null;

  return (
    <div className="mt-6 bg-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-gray-700">Live Preview</span>
        <div className="flex-1 border-t border-dashed border-gray-300" />
        <span className="text-xs text-gray-500">Updates as you type</span>
      </div>
      <div className="bg-white rounded-lg shadow-inner p-4">
        {previews[section]()}
      </div>
    </div>
  );
}
