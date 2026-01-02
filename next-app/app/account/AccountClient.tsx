"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  ShoppingBag, 
  Palette, 
  Package, 
  Plus,
  Clock,
  ChevronRight,
  Mail,
  Lock,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
  isAdmin?: boolean;
}

interface Order {
  id: number;
  orderNumber?: string;
  status: string;
  total: string;
  createdAt: string;
}

interface Design {
  id: number;
  name: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export default function Account() {
  const { data: session } = useSession();
  
  const { data: user } = useQuery<UserData>({
    queryKey: ["/api/auth/user"],
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: designs } = useQuery<Design[]>({
    queryKey: ["/api/designs"],
  });

  const sessionUser = session?.user as any;
  const firstName = user?.firstName || sessionUser?.name?.split(' ')[0] || "there";
  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.firstName?.[0]?.toUpperCase() || sessionUser?.name?.[0]?.toUpperCase() || "U";

  const recentOrders = orders?.slice(0, 3) || [];
  const designCount = designs?.length || 0;
  const orderCount = orders?.length || 0;
  const isAdmin = user?.isAdmin || sessionUser?.isAdmin;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'processing':
      case 'in_production':
        return 'bg-blue-100 text-blue-700';
      case 'shipped':
        return 'bg-purple-100 text-purple-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-20">
      {/* Profile Header */}
      <div className={`bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 pt-8 ${isAdmin ? 'pb-10' : 'pb-16'} px-4`}>
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl md:text-2xl font-bold shadow-lg">
              {user?.profileImageUrl || sessionUser?.image ? (
                <img 
                  src={user?.profileImageUrl || sessionUser?.image} 
                  alt={firstName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-heading text-2xl md:text-3xl text-white" data-testid="text-user-greeting">
                Hello, {firstName}!
              </h1>
              {(user?.email || sessionUser?.email) && (
                <p className="text-white/80 text-sm flex items-center gap-1.5 mt-1">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email || sessionUser?.email}
                </p>
              )}
            </div>
          </div>
          
          {/* Admin Dashboard - Integrated in header for admins */}
          {isAdmin && (
            <Link href="/admin">
              <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 cursor-pointer hover:bg-white/20 transition-colors" data-testid="button-admin-dashboard">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <LayoutDashboard className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-heading text-base md:text-lg text-white">Admin Dashboard</h2>
                    <p className="text-xs md:text-sm text-white/70">Manage products, orders, and settings</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="bg-white text-orange-600 hover:bg-white/90">
                  Open Dashboard
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Main Content - Overlaps header slightly */}
      <div className="container mx-auto max-w-2xl px-4 -mt-8">

        {/* Quick Actions */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-4 md:p-6">
            <h2 className="font-heading text-lg mb-4 text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/products">
                <div className="flex flex-col items-center p-3 md:p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer" data-testid="link-new-order">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-500 flex items-center justify-center mb-2">
                    <Plus className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-gray-900 text-center">New Order</span>
                </div>
              </Link>
              <Link href="/orders">
                <div className="flex flex-col items-center p-3 md:p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer" data-testid="link-my-orders">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500 flex items-center justify-center mb-2">
                    <Package className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-gray-900 text-center">My Orders</span>
                  <span className="text-xs text-gray-500">{orderCount} order{orderCount !== 1 ? 's' : ''}</span>
                </div>
              </Link>
              <Link href="/designs">
                <div className="flex flex-col items-center p-3 md:p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors cursor-pointer" data-testid="link-saved-designs">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500 flex items-center justify-center mb-2">
                    <Palette className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-gray-900 text-center">Designs</span>
                  <span className="text-xs text-gray-500">{designCount} saved</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg text-gray-900">Recent Orders</h2>
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="text-orange-600" data-testid="link-view-all-orders">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" data-testid={`order-row-${order.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                          <ShoppingBag className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">Order #{order.orderNumber || order.id}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getStatusColor(order.status)} text-xs mb-1`}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm font-medium text-gray-900">{formatPrice(parseFloat(order.total))}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm mb-3">No orders yet</p>
                <Link href="/products">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600" data-testid="button-start-shopping">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-4 md:p-6">
            <h2 className="font-heading text-lg mb-4 text-gray-900">Account Info</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <User className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900" data-testid="text-user-name">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.firstName || sessionUser?.name || "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Mail className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900" data-testid="text-user-email">
                    {user?.email || sessionUser?.email || "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Lock className="h-5 w-5 text-gray-500" />
                <div className="flex-1 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Password</p>
                    <p className="text-sm font-medium text-gray-900">••••••••</p>
                  </div>
                  <Link href="/account/password" className="text-sm text-orange-500 hover:underline">
                    Change
                  </Link>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card className="shadow-lg">
          <CardContent className="p-4 md:p-6">
            <Button 
              variant="outline" 
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300" 
              data-testid="button-sign-out"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
