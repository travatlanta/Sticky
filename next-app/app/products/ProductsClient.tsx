'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Package, Layers, Tag, ArrowUpDown, Flame, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  basePrice: string;
  categoryId: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Deal {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  originalPrice: string | null;
  dealPrice: string;
  badgeText: string | null;
  ctaText: string | null;
  ctaLink: string | null;
}

type SortOption = 'default' | 'price-low' | 'price-high' | 'name';

const getCategoryIcon = (name: string) => {
  if (name.toLowerCase().includes('sticker')) return Layers;
  if (name.toLowerCase().includes('label')) return Tag;
  return Package;
};

const getProductIcon = (name: string) => {
  if (name.toLowerCase().includes('sticker') || name.toLowerCase().includes('circle') || 
      name.toLowerCase().includes('oval') || name.toLowerCase().includes('die-cut')) return Layers;
  if (name.toLowerCase().includes('label')) return Tag;
  return Package;
};

export default function ProductsClient() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: deals } = useQuery<Deal[]>({
    queryKey: ['/api/deals/homepage'],
    queryFn: async () => {
      const res = await fetch('/api/deals/homepage');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = selectedCategory === null 
      ? [...products] 
      : products.filter((product) => product.categoryId === selectedCategory);
    
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => parseFloat(a.basePrice) - parseFloat(b.basePrice));
        break;
      case 'price-high':
        filtered.sort((a, b) => parseFloat(b.basePrice) - parseFloat(a.basePrice));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return filtered;
  }, [products, selectedCategory, sortBy]);

  if (productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-white border border-orange-200 rounded-full px-4 py-2 mb-4">
            <Layers className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">Premium Print Products</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-gray-900 mb-2">PRODUCTS</h1>
          <p className="text-lg text-gray-600">Choose a product to customize</p>
        </div>

        {/* Hot Deals Section */}
        {deals && deals.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="font-display text-2xl text-gray-900">HOT DEALS</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deals.map((deal) => {
                const originalPrice = deal.originalPrice ? parseFloat(deal.originalPrice) : null;
                const dealPrice = parseFloat(deal.dealPrice);
                const discount = originalPrice ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100) : null;
                
                return (
                  <div
                    key={deal.id}
                    className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-4 text-white relative overflow-hidden"
                    data-testid={`deal-card-${deal.id}`}
                  >
                    {deal.badgeText && (
                      <Badge className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
                        {deal.badgeText}
                      </Badge>
                    )}
                    {deal.imageUrl && (
                      <div className="w-full h-32 mb-3 rounded overflow-hidden">
                        <img src={deal.imageUrl} alt={deal.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="font-bold text-lg mb-1">{deal.title}</h3>
                    {deal.description && (
                      <p className="text-white/80 text-sm mb-3 line-clamp-2">{deal.description}</p>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl font-bold">${dealPrice.toFixed(2)}</span>
                      {originalPrice && (
                        <span className="text-white/60 line-through text-sm">${originalPrice.toFixed(2)}</span>
                      )}
                      {discount && (
                        <Badge className="bg-white/20 text-white hover:bg-white/30">{discount}% OFF</Badge>
                      )}
                    </div>
                    {deal.ctaLink && (
                      <Link href={deal.ctaLink}>
                        <Button size="sm" className="bg-white text-orange-600 hover:bg-white/90 w-full">
                          {deal.ctaText || 'Shop Now'}
                          <ExternalLink className="h-3 w-3 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Filter */}
        {categories && categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' 
                : 'border-orange-200 hover:bg-orange-50'}
              data-testid="filter-all"
            >
              All
            </Button>
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.name);
              return (
                <Button
                  key={category.id}
                  size="sm"
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' 
                    : 'border-orange-200 hover:bg-orange-50'}
                  data-testid={`filter-${category.slug}`}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        )}

        {/* Product count and sort */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <p className="text-sm text-gray-500">
            {filteredProducts.length} products
          </p>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px] border-orange-200" data-testid="sort-dropdown">
              <ArrowUpDown className="h-3 w-3 mr-2 text-gray-400" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="name">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const ProductIcon = getProductIcon(product.name);
            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="bg-white border border-orange-100 rounded-lg overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all group"
                data-testid={`product-card-${product.id}`}
              >
                <div className="aspect-square bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
                  {product.thumbnailUrl ? (
                    <img
                      src={product.thumbnailUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ProductIcon className="h-16 w-16 text-orange-400 group-hover:scale-110 transition-transform" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 text-gray-900">{product.name}</h3>
                  <p className="text-orange-600 font-medium">
                    From ${parseFloat(product.basePrice).toFixed(2)}
                  </p>
                  {product.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
