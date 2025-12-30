"use client";


import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { DollarSign, TrendingUp, ShoppingCart, CreditCard, Calendar, ArrowUpRight, ArrowDownRight, Package } from "lucide-react";

interface FinanceStats {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  recentOrders: Array<{
    id: number;
    orderNumber?: string;
    total: number;
    status: string;
    createdAt: string;
    customerEmail: string;
  }>;
  revenueByStatus: {
    paid: number;
    pending: number;
    delivered: number;
    cancelled: number;
  };
}

export default function AdminFinances() {
  const { data: stats, isLoading } = useQuery<FinanceStats>({
    queryKey: ["/api/admin/finances"],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-700";
      case "paid":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "shipped":
        return "bg-purple-100 text-purple-700";
      case "in_production":
        return "bg-indigo-100 text-indigo-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Finances</h1>
          <p className="text-gray-600 text-sm md:text-base">Track revenue and financial performance</p>
        </div>

        {/* Help Guide */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5 text-green-600" />
            Quick Guide
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Total Revenue</span><br /><span className="text-gray-600">All-time earnings from orders</span></p>
            </div>
            <div className="flex items-start gap-2">
              <ShoppingCart className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Order Stats</span><br /><span className="text-gray-600">Total orders and average value</span></p>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Revenue by Status</span><br /><span className="text-gray-600">Breakdown by order status</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Recent Orders</span><br /><span className="text-gray-600">Latest transactions at a glance</span></p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3" />
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              <Card className="p-4">
                <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats?.totalRevenue || 0)}</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </Card>
              <Card className="p-4">
                <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.orderCount || 0}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </Card>
              <Card className="p-4">
                <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats?.averageOrderValue || 0)}</p>
                <p className="text-sm text-gray-600">Avg Order Value</p>
              </Card>
              <Card className="p-4">
                <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center mb-3">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats?.revenueByStatus?.paid || 0)}</p>
                <p className="text-sm text-gray-600">Paid Revenue</p>
              </Card>
            </div>

            {/* Revenue by Status */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6">
              <Card className="p-4 md:p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-500" />
                  Revenue by Order Status
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-gray-700">Delivered</span>
                    </div>
                    <span className="font-bold text-green-600">{formatPrice(stats?.revenueByStatus?.delivered || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-gray-700">Paid</span>
                    </div>
                    <span className="font-bold text-blue-600">{formatPrice(stats?.revenueByStatus?.paid || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-gray-700">Pending</span>
                    </div>
                    <span className="font-bold text-yellow-600">{formatPrice(stats?.revenueByStatus?.pending || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-gray-700">Cancelled</span>
                    </div>
                    <span className="font-bold text-red-600">{formatPrice(stats?.revenueByStatus?.cancelled || 0)}</span>
                  </div>
                </div>
              </Card>

              {/* Recent Orders */}
              <Card className="p-4 md:p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-gray-500" />
                  Recent Transactions
                </h2>
                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Order #{order.orderNumber || order.id}</p>
                          <p className="text-xs text-gray-500">{order.customerEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                          <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No recent orders</p>
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
