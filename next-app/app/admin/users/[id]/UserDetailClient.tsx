"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShoppingBag,
  Package,
  Truck,
  Store,
  DollarSign,
  Clock,
  CheckCircle,
  Plus,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  subtotal: string;
  shippingCost: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  shippingAddress: any;
  notes: string | null;
  trackingNumber: string | null;
  createdAt: string;
  deliveryMethod: string | null;
  customerEmail: string | null;
  customerName: string | null;
}

interface UserDetail {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isAdmin: boolean;
  createdAt: string;
  profileImageUrl: string | null;
  orders: Order[];
  stats: {
    totalOrders: number;
    totalSpent: number;
    pendingOrders: number;
    completedOrders: number;
  };
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending_payment: { label: "Awaiting Payment", variant: "destructive" },
    pending: { label: "Pending", variant: "secondary" },
    paid: { label: "Paid", variant: "default" },
    in_production: { label: "In Production", variant: "default" },
    printed: { label: "Printed", variant: "default" },
    ready_for_pickup: { label: "Ready for Pickup", variant: "default" },
    shipped: { label: "Shipped", variant: "default" },
    delivered: { label: "Delivered", variant: "outline" },
    cancelled: { label: "Cancelled", variant: "destructive" },
  };

  const config = statusConfig[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UserDetailClient({ userId }: { userId: string }) {
  const router = useRouter();

  const { data: user, isLoading, error } = useQuery<UserDetail>({
    queryKey: [`/api/admin/users/${userId}`],
  });

  if (isLoading) {
    return (
      <AdminLayout title="User Details">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-200 rounded-lg" />
            <div className="h-48 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-96 bg-gray-200 rounded-lg" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout title="User Details">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Failed to load user details</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "No Name";

  return (
    <AdminLayout title="User Details">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()} data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-gray-500">{user.email}</p>
            </div>
            {user.isAdmin && (
              <Badge variant="default" className="ml-2">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>
          <Link href={`/admin/orders/create?customerId=${user.id}`}>
            <Button data-testid="button-create-order-for-user">
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-total-orders">{user.stats.totalOrders}</p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-total-spent">{formatPrice(user.stats.totalSpent)}</p>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-pending-orders">{user.stats.pendingOrders}</p>
                  <p className="text-sm text-gray-600">Pending Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900" data-testid="text-completed-orders">{user.stats.completedOrders}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium" data-testid="text-user-email">{user.email || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium" data-testid="text-user-phone">{user.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium" data-testid="text-user-joined">
                    {user.createdAt ? formatDate(user.createdAt) : "Unknown"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium" data-testid="text-user-role">
                    {user.isAdmin ? "Administrator" : "Customer"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-mono text-xs text-gray-600" data-testid="text-user-id">{user.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="block"
                      data-testid={`link-order-${order.id}`}
                    >
                      <div className="border rounded-lg p-4 hover-elevate transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-medium text-gray-900" data-testid={`text-order-number-${order.id}`}>
                              #{order.orderNumber}
                            </span>
                            {getStatusBadge(order.status)}
                            {order.deliveryMethod === "pickup" && (
                              <Badge variant="outline" className="text-xs">
                                <Store className="h-3 w-3 mr-1" />
                                Pickup
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <ExternalLink className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {formatDateTime(order.createdAt)}
                          </span>
                          <span className="font-semibold text-gray-900" data-testid={`text-order-total-${order.id}`}>
                            {formatPrice(parseFloat(order.totalAmount || "0"))}
                          </span>
                        </div>
                        {order.trackingNumber && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                            <Truck className="h-4 w-4" />
                            <span>Tracking: {order.trackingNumber}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
