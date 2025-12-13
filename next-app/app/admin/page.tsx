"use client";
export const dynamic = "force-dynamic";
export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { formatPrice } from "@/lib/utils";
import { Package, ShoppingCart, DollarSign, Users } from "lucide-react";

interface DashboardStats {
  orderCount: number;
  revenue: number;
  productCount: number;
  userCount: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  const statCards = [
    {
      label: "Total Orders",
      value: stats?.orderCount || 0,
      icon: ShoppingCart,
      color: "bg-blue-500",
      href: "/admin/orders",
    },
    {
      label: "Revenue",
      value: formatPrice(stats?.revenue || 0),
      icon: DollarSign,
      color: "bg-green-500",
      href: "/admin/finances",
    },
    {
      label: "Products",
      value: stats?.productCount || 0,
      icon: Package,
      color: "bg-purple-500",
      href: "/admin/products",
    },
    {
      label: "Users",
      value: stats?.userCount || 0,
      icon: Users,
      color: "bg-orange-500",
      href: "/admin/users",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm md:text-base">Welcome to the admin panel</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 md:p-6 shadow-sm animate-pulse">
                <div className="h-10 w-10 md:h-12 md:w-12 bg-gray-200 rounded-lg mb-3 md:mb-4" />
                <div className="h-6 md:h-8 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link key={stat.label} href={stat.href}>
                  <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow" data-testid={`link-stat-${stat.label.toLowerCase().replace(' ', '-')}`}>
                    <div className={`h-10 w-10 md:h-12 md:w-12 ${stat.color} rounded-lg flex items-center justify-center mb-3 md:mb-4`}>
                      <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-gray-600 text-sm">{stat.label}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-6 md:mt-8 grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/admin/products" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm md:text-base" data-testid="link-quick-products">
                Add New Product
              </Link>
              <Link href="/admin/promotions" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm md:text-base" data-testid="link-quick-promotions">
                Create Promotion Code
              </Link>
              <Link href="/admin/orders" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm md:text-base" data-testid="link-quick-orders">
                View Recent Orders
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Admin Guide</h2>
            <div className="text-xs md:text-sm text-gray-600 space-y-2">
              <p><strong>Products:</strong> Add, edit, and manage your product catalog</p>
              <p><strong>Orders:</strong> View and update order statuses</p>
              <p><strong>Promotions:</strong> Create and manage discount codes</p>
              <p><strong>Settings:</strong> Configure site-wide settings</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
