import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";
import { Package, Layers, CreditCard, FileImage, Image, Sparkles, Mail, FileText, BookOpen, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getCategoryIcon = (name: string) => {
  if (name.toLowerCase().includes("sticker")) return Layers;
  if (name.toLowerCase().includes("card")) return CreditCard;
  if (name.toLowerCase().includes("flyer")) return FileImage;
  if (name.toLowerCase().includes("poster")) return Image;
  if (name.toLowerCase().includes("postcard")) return Mail;
  if (name.toLowerCase().includes("brochure")) return BookOpen;
  return Package;
};

const getProductIcon = (name: string) => {
  if (name.includes("Sticker") || name.includes("Circle") || name.includes("Oval") || name.includes("Rectangle") || name.includes("Die-Cut")) return Layers;
  if (name.includes("Card")) return CreditCard;
  if (name.includes("Flyer")) return FileImage;
  if (name.includes("Poster")) return Image;
  if (name.includes("Postcard")) return Mail;
  if (name.includes("Brochure")) return BookOpen;
  return Package;
};

const getProductColor = (name: string) => {
  if (name.includes("Sticker") || name.includes("Circle") || name.includes("Oval") || name.includes("Rectangle") || name.includes("Die-Cut")) return "text-orange-500";
  if (name.includes("Card")) return "text-blue-500";
  if (name.includes("Flyer")) return "text-green-500";
  if (name.includes("Poster")) return "text-purple-500";
  if (name.includes("Postcard")) return "text-pink-500";
  if (name.includes("Brochure")) return "text-teal-500";
  return "text-orange-400";
};

type SortOption = "default" | "price-low" | "price-high" | "size-small" | "size-large" | "name";

// Helper to extract size from product name (e.g., "2" x 2"" -> 4 sq inches)
const extractSize = (name: string): number => {
  // Match patterns like 1", 2x2, 3" x 3", etc.
  const sizeMatch = name.match(/(\d+(?:\.\d+)?)\s*["″x×]\s*(\d+(?:\.\d+)?)?/i);
  if (sizeMatch) {
    const dim1 = parseFloat(sizeMatch[1]);
    const dim2 = sizeMatch[2] ? parseFloat(sizeMatch[2]) : dim1;
    return dim1 * dim2;
  }
  // Check for single dimension like "1"" or "2""
  const singleMatch = name.match(/(\d+(?:\.\d+)?)\s*["″]/);
  if (singleMatch) {
    const dim = parseFloat(singleMatch[1]);
    return dim * dim; // Assume square
  }
  return 999; // Custom/unknown sizes at end
};

// Helper to get style type from product name
const getStyleType = (name: string): string => {
  if (name.includes("Circle")) return "circle";
  if (name.includes("Oval")) return "oval";
  if (name.includes("Rectangle")) return "rectangle";
  if (name.includes("Square")) return "square";
  if (name.includes("Die-Cut")) return "die-cut";
  if (name.includes("Kiss-Cut")) return "kiss-cut";
  if (name.includes("Sheet")) return "sheet";
  return "other";
};

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("default");

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = selectedCategory === null 
      ? [...products] 
      : products.filter((product: any) => product.categoryId === selectedCategory);
    
    // Apply sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a: any, b: any) => parseFloat(a.basePrice) - parseFloat(b.basePrice));
        break;
      case "price-high":
        filtered.sort((a: any, b: any) => parseFloat(b.basePrice) - parseFloat(a.basePrice));
        break;
      case "size-small":
        filtered.sort((a: any, b: any) => extractSize(a.name) - extractSize(b.name));
        break;
      case "size-large":
        filtered.sort((a: any, b: any) => extractSize(b.name) - extractSize(a.name));
        break;
      case "name":
        filtered.sort((a: any, b: any) => a.name.localeCompare(b.name));
        break;
      default:
        // Default order from database
        break;
    }
    return filtered;
  }, [products, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="container mx-auto px-3 py-4 pb-16 md:px-4 md:py-8 md:pb-20">
        {/* Header - Compact on mobile */}
        <div className="mb-4 md:mb-8 text-center md:text-left">
          <div className="hidden md:inline-flex items-center gap-2 bg-white border border-orange-200 rounded-full px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Premium Print Products</span>
          </div>
          <h1 className="font-heading text-2xl md:text-5xl text-gray-900 mb-1 md:mb-2">Products</h1>
          <p className="text-sm md:text-lg text-gray-600">Choose a product to customize</p>
        </div>

        {/* Category Filter - Horizontal scroll on mobile */}
        {categories && categories.length > 0 && (
          <div className="mb-4 md:mb-8 -mx-3 px-3 md:mx-0 md:px-0">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 md:flex-wrap scrollbar-hide">
              <Button
                size="sm"
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 text-xs md:text-sm ${selectedCategory === null 
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white" 
                  : "border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                }`}
                data-testid="filter-all"
              >
                All
              </Button>
              {categories.map((category: any) => {
                const Icon = getCategoryIcon(category.name);
                return (
                  <Button
                    key={category.id}
                    size="sm"
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex-shrink-0 text-xs md:text-sm ${selectedCategory === category.id 
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white" 
                      : "border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                    }`}
                    data-testid={`filter-${category.slug}`}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {category.name.replace("Custom ", "")}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Product count and sort */}
        <div className="flex items-center justify-between mb-3 md:mb-6 gap-2">
          <p className="text-xs text-gray-500">
            {filteredProducts.length} products
          </p>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3 w-3 text-gray-400 hidden md:block" />
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[140px] md:w-[180px] h-8 text-xs md:text-sm border-orange-200" data-testid="sort-select">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default" data-testid="sort-default">Default</SelectItem>
                <SelectItem value="price-low" data-testid="sort-price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high" data-testid="sort-price-high">Price: High to Low</SelectItem>
                <SelectItem value="size-small" data-testid="sort-size-small">Size: Small to Large</SelectItem>
                <SelectItem value="size-large" data-testid="sort-size-large">Size: Large to Small</SelectItem>
                <SelectItem value="name" data-testid="sort-name">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid - 2 columns mobile, 3 tablet, 4 desktop */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse border border-orange-100">
                <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 to-yellow-100" />
                <div className="p-2 md:p-4">
                  <div className="h-3 md:h-5 bg-orange-100 rounded w-3/4 mb-1 md:mb-2" />
                  <div className="h-3 md:h-4 bg-orange-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {filteredProducts.map((product: any) => {
              const Icon = getProductIcon(product.name);
              const iconColor = getProductColor(product.name);
              return (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div 
                    className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer border border-orange-100 active:scale-[0.98]"
                    data-testid={`product-card-${product.id}`}
                  >
                    {/* Compact image area */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 flex items-center justify-center relative">
                      {product.thumbnailUrl ? (
                        <img
                          src={product.thumbnailUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className={`h-10 w-10 md:h-14 md:w-14 ${iconColor}`} />
                      )}
                      {/* Price badge on image */}
                      <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur px-2 py-1 rounded-lg shadow-sm">
                        <span className="text-orange-600 font-bold text-xs md:text-sm">
                          {formatPrice(product.basePrice)}
                        </span>
                      </div>
                    </div>
                    {/* Compact info */}
                    <div className="p-2 md:p-4">
                      <h3 className="font-heading text-sm md:text-lg text-gray-900 leading-tight line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-400 text-xs mt-1 hidden md:block line-clamp-1">
                        {product.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 md:p-12 text-center border border-orange-100 shadow-sm">
            <Package className="h-12 w-12 md:h-20 md:w-20 text-orange-300 mx-auto mb-3 md:mb-4" />
            <h3 className="font-heading text-lg md:text-2xl text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 text-sm">Try selecting a different category</p>
          </div>
        )}
      </div>
    </div>
  );
}
