'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Package, Layers, Tag, ArrowUpDown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  isDealProduct?: boolean;
  fixedPrice?: string | null;
  fixedQuantity?: number | null;
  displayPricePerUnit?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
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

  // Separate regular products from deal products
  const { regularProducts, dealProducts } = useMemo(() => {
    if (!products) return { regularProducts: [], dealProducts: [] };
    
    // First filter by category
    let filtered = selectedCategory === null 
      ? [...products] 
      : products.filter((product) => product.categoryId === selectedCategory);
    
    // Separate deals from regular products
    const deals = filtered.filter(p => p.isDealProduct === true);
    const regular = filtered.filter(p => !p.isDealProduct);
    
    // Apply sorting function
    const sortProducts = (arr: Product[]) => {
      switch (sortBy) {
        case 'price-low':
          arr.sort((a, b) => parseFloat(a.basePrice) - parseFloat(b.basePrice));
          break;
        case 'price-high':
          arr.sort((a, b) => parseFloat(b.basePrice) - parseFloat(a.basePrice));
          break;
        case 'name':
          arr.sort((a, b) => a.name.localeCompare(b.name));
          break;
        default:
          break;
      }
      return arr;
    };
    
    return {
      regularProducts: sortProducts(regular),
      dealProducts: sortProducts(deals)
    };
  }, [products, selectedCategory, sortBy]);
  
  const filteredProducts = [...regularProducts, ...dealProducts];

  if (productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Our Products
          </h1>
          <p className="text-muted-foreground">
            Choose a product to start customizing
          </p>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          {/* Category Filter */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedCategory === null ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(null)}
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
                    data-testid={`filter-${category.slug}`}
                  >
                    <Icon className="h-3 w-3 mr-1.5" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          )}
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {filteredProducts.length} products
            </span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[160px]" data-testid="sort-dropdown">
                <ArrowUpDown className="h-3 w-3 mr-2 text-muted-foreground" />
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
        </div>

        {/* Regular Products Section */}
        {regularProducts.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regularProducts.map((product) => {
                const ProductIcon = getProductIcon(product.name);
                // Use displayPricePerUnit (tier-based) if available, fallback to basePrice
                const price = product.displayPricePerUnit 
                  ? parseFloat(product.displayPricePerUnit) 
                  : parseFloat(product.basePrice);
                
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group block"
                    data-testid={`product-card-${product.id}`}
                  >
                    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-border">
                      <div className="aspect-square relative bg-muted overflow-hidden">
                        {product.thumbnailUrl ? (
                          <img
                            src={product.thumbnailUrl}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                            <ProductIcon className="h-20 w-20 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-2">
                          <div>
                            <span className="text-xs text-muted-foreground">From</span>
                            <p className="text-lg font-bold text-foreground">
                              ${price.toFixed(2)}
                            </p>
                          </div>
                          <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Customize
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Hot Deals Section */}
        {dealProducts.length > 0 && (
          <div className="mt-12">
            <div className="mb-6 flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-bold text-lg">Hot Deals</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {dealProducts.map((product) => {
                const ProductIcon = getProductIcon(product.name);
                // For deals, show total fixed price (not per unit)
                const price = product.fixedPrice 
                  ? parseFloat(product.fixedPrice) 
                  : (product.displayPricePerUnit 
                      ? parseFloat(product.displayPricePerUnit) 
                      : parseFloat(product.basePrice));
                
                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group block"
                    data-testid={`deal-card-${product.id}`}
                  >
                    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
                      <div className="aspect-square relative bg-muted overflow-hidden">
                        {product.thumbnailUrl ? (
                          <img
                            src={product.thumbnailUrl}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-yellow-100">
                            <ProductIcon className="h-20 w-20 text-orange-400" />
                          </div>
                        )}
                        {/* Deal Badge */}
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                          DEAL
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-2">
                          <div>
                            <span className="text-xs text-muted-foreground">
                              {product.fixedQuantity ? `${product.fixedQuantity} pcs for` : 'From'}
                            </span>
                            <p className="text-lg font-bold text-orange-600">
                              ${price.toFixed(2)}
                            </p>
                          </div>
                          <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity bg-orange-100 text-orange-700 hover:bg-orange-200">
                            Customize
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
