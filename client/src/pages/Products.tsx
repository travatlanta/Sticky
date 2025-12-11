import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";
import { Package, Sticker, CreditCard, FileImage, Image, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (selectedCategory === null) return products;
    return products.filter((product: any) => product.categoryId === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-white border border-orange-200 rounded-full px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Premium Print Products</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-gray-900 mb-2">All Products</h1>
          <p className="text-lg text-gray-600">Choose a product to start customizing</p>
        </div>

        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null 
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white" 
                : "border-orange-200 hover:bg-orange-50 hover:border-orange-300"
              }
            >
              All Products
            </Button>
            {categories.map((category: any) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id 
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white" 
                  : "border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                }
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse border border-orange-100">
                <div className="aspect-square bg-gradient-to-br from-orange-100 to-yellow-100" />
                <div className="p-4">
                  <div className="h-5 bg-orange-100 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-orange-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid md:grid-cols-4 gap-6">
            {filteredProducts.map((product: any) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border border-orange-100">
                  <div className="aspect-square bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-50 flex items-center justify-center">
                    {product.thumbnailUrl ? (
                      <img
                        src={product.thumbnailUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      product.name.includes("Sticker") ? <Sticker className="h-20 w-20 text-orange-500" /> : 
                      product.name.includes("Card") ? <CreditCard className="h-20 w-20 text-blue-500" /> :
                      product.name.includes("Flyer") ? <FileImage className="h-20 w-20 text-green-500" /> :
                      product.name.includes("Poster") ? <Image className="h-20 w-20 text-purple-500" /> : 
                      <Package className="h-20 w-20 text-orange-400" />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading text-xl text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <p className="text-orange-500 font-bold text-lg">
                      From {formatPrice(product.basePrice)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-orange-100 shadow-md">
            <Package className="h-20 w-20 text-orange-300 mx-auto mb-4" />
            <h3 className="font-heading text-2xl text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500">Products will appear here once they're added.</p>
          </div>
        )}
      </div>
    </div>
  );
}
