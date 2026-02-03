"use client";

import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  Truck,
  FileImage,
  Calendar,
  DollarSign,
  Store,
} from "lucide-react";
import Link from "next/link";

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  pricePerUnit: string;
  totalPrice: string;
  selectedOptions?: Record<string, any>;
  product?: {
    id: number;
    name: string;
    imageUrl?: string;
  };
  design?: {
    id: number;
    name: string;
    thumbnailUrl?: string;
    finalImageUrl?: string;
  };
  resolvedOptions?: Record<string, string>;
}

interface OrderDetail {
  id: number;
  orderNumber?: string;
  userId: string;
  status: string;
  subtotal: string;
  shippingCost: string;
  taxAmount?: string;
  discountAmount?: string;
  totalAmount: string;
  shippingAddress: any;
  notes?: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  deliveryMethod?: "shipping" | "pickup";
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  user?: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  };
  items: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending_payment: "bg-orange-100 text-orange-800",
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  in_production: "bg-purple-100 text-purple-800",
  printed: "bg-indigo-100 text-indigo-800",
  ready_for_pickup: "bg-teal-100 text-teal-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const { data: order, isLoading, error } = useQuery<OrderDetail>({
    queryKey: ["/api/admin/orders", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Link href="/admin/orders">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <Card>
            <CardContent className="p-6">
              <p className="text-red-500">Order not found or failed to load.</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const customerName =
    order.customerName ||
    (order.user
      ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim()
      : null) ||
    "Guest Customer";
  const customerEmail = order.customerEmail || order.user?.email || null;
  const customerPhone = order.customerPhone || order.user?.phone || null;
  const shippingAddress = order.shippingAddress || {};

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/orders">
            <Button variant="ghost" data-testid="button-back-orders">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold" data-testid="text-order-title">
            Order #{order.orderNumber || order.id}
          </h1>
          <Badge
            className={statusColors[order.status] || "bg-gray-100 text-gray-800"}
            data-testid="badge-order-status"
          >
            {formatStatus(order.status)}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span data-testid="text-customer-name">{customerName}</span>
              </div>
              {customerEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`mailto:${customerEmail}`}
                    className="text-blue-600 hover:underline"
                    data-testid="text-customer-email"
                  >
                    {customerEmail}
                  </a>
                </div>
              )}
              {customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`tel:${customerPhone}`}
                    className="text-blue-600 hover:underline"
                    data-testid="text-customer-phone"
                  >
                    {customerPhone}
                  </a>
                </div>
              )}
              {order.user && (
                <div className="pt-2 border-t">
                  <Link href={`/admin/users?id=${order.user.id}`}>
                    <Button variant="outline" size="sm" data-testid="button-view-user">
                      View User Profile
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping/Pickup Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {order.deliveryMethod === "pickup" ? (
                  <Store className="w-5 h-5" />
                ) : (
                  <Truck className="w-5 h-5" />
                )}
                {order.deliveryMethod === "pickup" ? "Pickup" : "Shipping"} Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.deliveryMethod === "pickup" ? (
                <div className="space-y-2">
                  <Badge className="bg-teal-100 text-teal-800">Pickup Order</Badge>
                  {order.notes && order.notes.includes("--- PICKUP ORDER ---") && (
                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                      {order.notes.split("--- PICKUP ORDER ---")[1]?.trim() || "Pickup details in notes"}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                    <div data-testid="text-shipping-address">
                      {shippingAddress.name && <div className="font-medium">{shippingAddress.name}</div>}
                      {shippingAddress.address1 && <div>{shippingAddress.address1}</div>}
                      {shippingAddress.address2 && <div>{shippingAddress.address2}</div>}
                      {(shippingAddress.city || shippingAddress.state || shippingAddress.zip) && (
                        <div>
                          {shippingAddress.city}
                          {shippingAddress.city && shippingAddress.state && ", "}
                          {shippingAddress.state} {shippingAddress.zip}
                        </div>
                      )}
                      {shippingAddress.country && <div>{shippingAddress.country}</div>}
                    </div>
                  </div>
                  {order.trackingNumber && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {order.trackingCarrier && `${order.trackingCarrier}: `}
                        <span className="font-mono" data-testid="text-tracking-number">
                          {order.trackingNumber}
                        </span>
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span data-testid="text-subtotal">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span data-testid="text-shipping">{formatPrice(order.shippingCost)}</span>
              </div>
              {order.taxAmount && parseFloat(order.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(order.taxAmount)}</span>
                </div>
              )}
              {order.discountAmount && parseFloat(order.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span data-testid="text-total">{formatPrice(order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-mono" data-testid="text-order-number">
                  {order.orderNumber || `#${order.id}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span data-testid="text-created-at">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {order.notes && !order.notes.includes("--- PICKUP ORDER ---") && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground block mb-1">Notes</span>
                  <p className="text-sm whitespace-pre-line" data-testid="text-notes">
                    {order.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items ({order.items?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border rounded-lg"
                    data-testid={`order-item-${item.id}`}
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.design?.thumbnailUrl || item.design?.finalImageUrl ? (
                        <img
                          src={item.design.thumbnailUrl || item.design.finalImageUrl}
                          alt={item.product?.name || "Product"}
                          className="w-full h-full object-cover"
                        />
                      ) : item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileImage className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium" data-testid={`text-item-name-${item.id}`}>
                        {item.product?.name || "Product"}
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatPrice(item.pricePerUnit)}
                      </div>
                      {item.resolvedOptions && Object.keys(item.resolvedOptions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(item.resolvedOptions).map(([key, value]) => (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <div className="font-medium" data-testid={`text-item-total-${item.id}`}>
                        {formatPrice(item.totalPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No items in this order.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
