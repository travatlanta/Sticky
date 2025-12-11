import { useQuery } from "@tanstack/react-query";
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
    },
    {
      label: "Revenue",
      value: formatPrice(stats?.revenue || 0),
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      label: "Products",
      value: stats?.productCount || 0,
      icon: Package,
      color: "bg-purple-500",
    },
    {
      label: "Users",
      value: stats?.userCount || 0,
      icon: Users,
      color: "bg-orange-500",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to the admin panel</p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4" />
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className={`h-12 w-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <a href="/admin/products" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                Add New Product
              </a>
              <a href="/admin/promotions" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                Create Promotion Code
              </a>
              <a href="/admin/orders" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                View Recent Orders
              </a>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Admin Guide</h2>
            <div className="text-sm text-gray-600 space-y-2">
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
