import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Package, ArrowRight, Clock, CheckCircle, Truck } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-yellow-500", label: "Pending" },
  paid: { icon: CheckCircle, color: "text-green-500", label: "Paid" },
  in_production: { icon: Package, color: "text-blue-500", label: "In Production" },
  printed: { icon: Package, color: "text-purple-500", label: "Printed" },
  shipped: { icon: Truck, color: "text-indigo-500", label: "Shipped" },
  delivered: { icon: CheckCircle, color: "text-green-600", label: "Delivered" },
  cancelled: { icon: Clock, color: "text-red-500", label: "Cancelled" },
};

export default function Orders() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to view your orders.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-gray-500 text-sm">Order #</span>
                      <span className="font-semibold ml-1">{order.id}</span>
                    </div>
                    <div className={`flex items-center ${status.color}`}>
                      <StatusIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">{status.label}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600">
                        Placed on{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xl font-bold text-primary-500 mt-1">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  {order.trackingNumber && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Tracking: <span className="font-medium">{order.trackingNumber}</span>
                        {order.trackingCarrier && (
                          <span className="text-gray-500"> ({order.trackingCarrier})</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">
              When you place an order, it will appear here.
            </p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
