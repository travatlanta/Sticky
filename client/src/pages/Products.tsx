import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { formatPrice } from "@/lib/utils";
import { Package, Sticker, CreditCard, FileImage, Image } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
          <p className="text-gray-600 mt-1">Choose a product to start customizing</p>
        </div>

        {categories && categories.length > 0 && (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === null
                  ? "bg-primary-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              All Products
            </button>
            {categories.map((category: any) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid md:grid-cols-4 gap-6">
            {filteredProducts.map((product: any) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {product.thumbnailUrl ? (
                      <img
                        src={product.thumbnailUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      product.name.includes("Sticker") ? <Sticker className="h-16 w-16 text-orange-500" /> : 
                      product.name.includes("Card") ? <CreditCard className="h-16 w-16 text-blue-500" /> :
                      product.name.includes("Flyer") ? <FileImage className="h-16 w-16 text-green-500" /> :
                      product.name.includes("Poster") ? <Image className="h-16 w-16 text-purple-500" /> : 
                      <Package className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-gray-500 text-sm mb-2 line-clamp-2">{product.description}</p>
                    <p className="text-primary-500 font-semibold">
                      From {formatPrice(product.basePrice)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500">Products will appear here once they're added.</p>
          </div>
        )}
      </div>
    </div>
  );
}
