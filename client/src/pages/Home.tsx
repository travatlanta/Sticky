import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ArrowRight, Plus, Package, FileText, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();

  const { data: products } = useQuery({
    queryKey: ["/api/products?featured=true"],
  });

  const { data: designs } = useQuery({
    queryKey: ["/api/designs"],
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-white py-8 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white border border-orange-200 rounded-full px-4 py-2 mb-4">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Welcome back!</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-gray-900 mb-2">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">{user?.firstName || "there"}</span>!
            </h1>
            <p className="text-lg text-gray-600">Ready to create something awesome?</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Link href="/products">
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-orange-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
                  <Plus className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-heading text-xl mb-1 text-gray-900">New Order</h3>
                <p className="text-gray-500">Browse products and start designing</p>
              </div>
            </Link>
            <Link href="/orders">
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                  <Package className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-heading text-xl mb-1 text-gray-900">My Orders</h3>
                <p className="text-gray-500">
                  {orders?.length || 0} orders
                </p>
              </div>
            </Link>
            <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-transparent">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-heading text-xl mb-1 text-gray-900">Saved Designs</h3>
              <p className="text-gray-500">
                {designs?.length || 0} designs saved
              </p>
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-3xl text-gray-900">Featured Products</h2>
              <Link href="/products">
                <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {products && products.length > 0 ? (
              <div className="grid md:grid-cols-4 gap-6">
                {products.slice(0, 4).map((product: any) => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-orange-100">
                      <div className="aspect-square bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-50 flex items-center justify-center">
                        {product.thumbnailUrl ? (
                          <img
                            src={product.thumbnailUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-12 w-12 text-orange-400" />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-heading text-lg text-gray-900">{product.name}</h3>
                        <p className="text-orange-500 font-bold mt-1">
                          From {formatPrice(product.basePrice)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-orange-100">
                <Package className="h-16 w-16 text-orange-300 mx-auto mb-4" />
                <p className="text-gray-500">No products available yet. Check back soon!</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
