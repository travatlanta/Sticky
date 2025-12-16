"use client";

// Preserve dynamic export if needed
export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  Package,
  ArrowRight,
  Clock,
  CheckCircle,
  Truck,
} from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Define status configuration for order statuses
const statusConfig: Record<
  string,
  {
    icon: any;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  pending: {
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    label: "Pending",
  },
  paid: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Paid",
  },
  in_production: {
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "In Production",
  },
  printed: {
    icon: Package,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    label: "Printed",
  },
  shipped: {
    icon: Truck,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    label: "Shipped",
  },
  delivered: {
    icon: CheckCircle,
    color: "text-green-700",
    bgColor: "bg-green-100",
    label: "Delivered",
  },
  cancelled: {
    icon: Clock,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Cancelled",
  },
};

/**
 * Customer order list component.
 *
 * Displays a list of the authenticated user's orders with basic information
 * such as order number, date placed, status, and total. Each row is
 * clickable and leads to the order detail page. Includes loading and
 * redirect behaviours if the user is not signed in.
 */
export default function Orders() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const authLoading = status === "loading";
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If the authentication state has resolved and the user is not
    // authenticated, redirect them to the login page after showing a toast.
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to view your orders.",
        variant: "destructive",
      });
      setTimeout(() => {
        router.push("/login");
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast, router]);

  // Fetch orders only when the user is authenticated. We type the
  // returned data as an array of unknown objects. Each order will be
  // treated as `any` within the map to avoid implicit any errors.
  const { data: orders, isLoading } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  // Show loading skeleton while authentication state or orders are loading.
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-orange-100 rounded w-1/4" />
            <div className="h-32 bg-orange-50 rounded-2xl" />
            <div className="h-32 bg-orange-50 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="container mx-auto px-4 py-8 pb-16 md:pb-20">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-white border border-orange-200 rounded-full px-4 py-2 mb-4">
            <Package className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">Order History</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-gray-900">My Orders</h1>
        </div>

        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order: any) => {
              // Determine the status configuration; default to pending if unknown
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-6 shadow-md border border-orange-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-gray-500 text-sm">Order #</span>
                      <span className="font-heading text-lg ml-1">{order.id}</span>
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bgColor} ${status.color}`}
                    >
                      <StatusIcon className="h-4 w-4" />
                      <span className="font-medium text-sm">{status.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600">
                        Placed on {" "}
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-2xl font-bold text-orange-500 mt-1">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                    <Link href={`/orders/${order.id}`}>
                      <Button
                        variant="outline"
                        className="border-orange-200 hover:bg-orange-50"
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  {order.trackingNumber && (
                    <div className="mt-4 pt-4 border-t border-orange-100">
                      <p className="text-sm text-gray-600">
                        <Truck className="w-4 h-4 inline mr-1 text-orange-500" />
                        Tracking: <span className="font-medium">{order.trackingNumber}</span>
                        {order.trackingCarrier && (
                          <span className="text-gray-500">
                            {" "}({order.trackingCarrier})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-orange-100 shadow-md">
            <Package className="h-20 w-20 text-orange-300 mx-auto mb-4" />
            <h3 className="font-heading text-2xl text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">When you place an order, it will appear here.</p>
            <Link href="/products">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                Browse Products
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}