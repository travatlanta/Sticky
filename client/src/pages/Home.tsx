import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ArrowRight, Plus, Package, FileText } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || "there"}!
          </h1>
          <p className="text-gray-600 mt-1">Ready to create something awesome?</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link href="/products">
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-primary-500" />
              </div>
              <h3 className="font-semibold text-lg mb-1">New Order</h3>
              <p className="text-gray-500 text-sm">Browse products and start designing</p>
            </div>
          </Link>
          <Link href="/orders">
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-lg mb-1">My Orders</h3>
              <p className="text-gray-500 text-sm">
                {orders?.length || 0} orders
              </p>
            </div>
          </Link>
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-transparent">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Saved Designs</h3>
            <p className="text-gray-500 text-sm">
              {designs?.length || 0} designs saved
            </p>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/products">
              <Button variant="ghost">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {products && products.length > 0 ? (
            <div className="grid md:grid-cols-4 gap-6">
              {products.slice(0, 4).map((product: any) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      {product.thumbnailUrl ? (
                        <img
                          src={product.thumbnailUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-primary-500 font-medium mt-1">
                        From {formatPrice(product.basePrice)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center">
              <p className="text-gray-500">No products available yet. Check back soon!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
