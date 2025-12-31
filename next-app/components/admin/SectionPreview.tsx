"use client";

import type { HomepageSettings } from "@/lib/homepage-settings";
import { 
  Palette, Sparkles, Truck, Shield, 
  Sticker, Tag, Wine, Package, Circle, Layers
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
    
    if (!hero) return <div className="p-4 text-gray-400 text-center text-xs">No hero data</div>;
    
    return (
      <div className="bg-gradient-to-br from-orange-100 via-white to-yellow-100 rounded-lg p-4 border-2 border-dashed border-orange-300">
        <div className="text-center space-y-2">
          <span className="inline-block bg-orange-200 text-orange-800 text-[8px] px-2 py-0.5 rounded-full">
            {settings?.hero?.badge || "Badge"}
          </span>
          <div className="font-bold text-sm text-gray-900">
            {heroView === "loggedIn" ? (
              <>
                <span className="text-gray-600 text-[10px] block">{(hero as any).welcomePrefix || ""}</span>
                {(hero as any).headline || "Headline"}
              </>
            ) : (
              <>
                <span className="text-orange-500">{(hero as any).headlineTop || "Top"}</span>{" "}
                {(hero as any).headlineBottom || "Bottom"}
              </>
            )}
          </div>
          <p className="text-[8px] text-gray-600 line-clamp-2">{hero.description || ""}</p>
          <div className="flex gap-1 justify-center mt-2">
            <span className="bg-orange-500 text-white text-[7px] px-2 py-0.5 rounded">
              {hero.primaryButtonText || "Button"}
            </span>
            <span className="border border-gray-300 text-[7px] px-2 py-0.5 rounded">
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
      return <div className="p-4 text-gray-400 text-center text-xs">No feature cards</div>;
    }
    
    return (
      <div className="bg-white rounded-lg p-3 border">
        <div className="grid grid-cols-2 gap-2">
          {cards.map((card, i) => {
            const Icon = iconMap[card?.iconName] || Sparkles;
            return (
              <div key={i} className="bg-gray-50 rounded p-2 text-center">
                <div className="w-6 h-6 mx-auto rounded-full bg-orange-100 flex items-center justify-center mb-1">
                  <Icon className="w-3 h-3 text-orange-600" />
                </div>
                <p className="text-[8px] font-semibold truncate">{card?.title || ""}</p>
                <p className="text-[6px] text-gray-500 line-clamp-2">{card?.description || ""}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStickersPreview = () => {
    const stickers = settings?.customStickers;
    const featuredIds = stickers?.featuredProductIds || [];
    const displayProducts = featuredIds.length > 0 
      ? featuredIds.map(id => products.find(p => p.id === id)).filter((p): p is Product => p !== undefined).slice(0, 4)
      : products.slice(0, 4);
    
    return (
      <div className="bg-gradient-to-br from-orange-100 via-yellow-50 to-red-50 rounded-lg p-4 relative overflow-hidden" style={{ minHeight: '140px' }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-bold text-xs text-gray-900">{stickers?.title || "Custom Stickers"}</h3>
            <p className="text-[8px] text-gray-600">{stickers?.subtitle || ""}</p>
          </div>
        </div>
        
        <div className="relative h-24">
          {displayProducts.map((product, i) => {
            const positions = [
              { top: '0', left: '0', rotate: '-8deg' },
              { top: '40%', left: '10%', rotate: '5deg' },
              { top: '5%', right: '25%', rotate: '8deg' },
              { top: '45%', right: '5%', rotate: '-5deg' },
            ];
            const pos = positions[i] || positions[0];
            return (
              <div
                key={product.id}
                className="absolute bg-white rounded-lg p-1.5 shadow-md border border-orange-100"
                style={{
                  top: pos.top,
                  left: pos.left,
                  right: (pos as any).right,
                  transform: `rotate(${pos.rotate})`,
                  width: '52px',
                }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-yellow-50 rounded flex items-center justify-center mx-auto mb-1">
                  {product.thumbnailUrl ? (
                    <img src={product.thumbnailUrl} alt="" className="w-full h-full object-cover rounded" />
                  ) : (
                    <Layers className="h-4 w-4 text-orange-400" />
                  )}
                </div>
                <p className="text-[6px] font-medium text-gray-800 text-center truncate">{product.name.split(' ').slice(0, 2).join(' ')}</p>
              </div>
            );
          })}
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg text-center">
              <p className="text-[8px] font-bold text-gray-900">{stickers?.cardTitle || ""}</p>
              <p className="text-[6px] text-gray-600">{stickers?.cardSubtitle || ""}</p>
              <span className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white text-[6px] px-2 py-0.5 rounded mt-1">
                {stickers?.buttonText || "Design"}
              </span>
            </div>
          </div>
        </div>
        
        {featuredIds.length > 0 && (
          <p className="text-[7px] text-blue-600 mt-2 text-center">{featuredIds.length} featured product{featuredIds.length !== 1 ? 's' : ''} selected</p>
        )}
      </div>
    );
  };

  const renderLabelsPreview = () => {
    const labels = settings?.labels;
    const cards = labels?.cards ?? [];
    
    return (
      <div className="bg-white rounded-lg p-3 border">
        <span className="inline-block bg-orange-100 text-orange-800 text-[7px] px-1.5 py-0.5 rounded-full mb-2">
          {labels?.badge || "Labels"}
        </span>
        <h3 className="font-bold text-xs mb-1">{labels?.title || "Labels"}</h3>
        <p className="text-[7px] text-gray-600 line-clamp-2 mb-2">{labels?.description || ""}</p>
        <div className="grid grid-cols-3 gap-1">
          {cards.map((card, i) => (
            <div key={i} className="bg-gray-50 rounded p-1 text-center">
              <p className="text-[6px] font-semibold truncate">{card?.title || ""}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPopularPreview = () => {
    const popular = settings?.popularProducts;
    const products = popular?.products ?? [];
    
    return (
      <div className="bg-gray-50 rounded-lg p-3 border">
        <h3 className="font-bold text-xs mb-1">{popular?.title || "Popular Products"}</h3>
        <p className="text-[7px] text-gray-600 mb-2">{popular?.subtitle || ""}</p>
        <div className="grid grid-cols-3 gap-1">
          {products.map((product, i) => (
            <div key={i} className="bg-white rounded p-1.5 text-center border">
              <p className="text-[7px] font-semibold truncate">{product?.title || ""}</p>
              <p className="text-[5px] text-gray-500 truncate">{product?.price || ""}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCtaPreview = () => {
    const cta = settings?.cta;
    
    return (
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-4 text-white text-center">
        <h3 className="font-bold text-sm mb-1">{cta?.title || "Call to Action"}</h3>
        <p className="text-[8px] opacity-90 mb-2">{cta?.description || ""}</p>
        <span className="inline-block bg-white text-orange-600 text-[8px] px-3 py-1 rounded-full font-semibold">
          {cta?.buttonText || "Button"}
        </span>
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
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-gray-500">Live Preview</span>
        <div className="flex-1 border-t border-dashed border-gray-200" />
      </div>
      <div className="transform scale-100 origin-top">
        {previews[section]()}
      </div>
    </div>
  );
}
