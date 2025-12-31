"use client";


import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  Truck,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  Sticker,
  CreditCard,
  FileImage,
  Download,
  Image,
  Phone,
  Mail,
} from "lucide-react";

interface Design {
  id: number;
  name: string | null;
  previewUrl: string | null;
  highResExportUrl: string | null;
  customShapeUrl: string | null;
}

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: string;
  selectedOptions?: Record<string, any>;
  product?: {
    name: string;
  };
  design?: Design | null;
}

interface Order {
  id: number;
  orderNumber?: string;
  status: string;
  createdAt: string;
  subtotal: string;
  shippingCost?: string;
  discountAmount?: string;
  taxAmount?: string;
  totalAmount: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  shippingAddress?: any;
  notes?: string;
  items?: OrderItem[];
}

const statusConfig: Record<string, { icon: any; color: string; label: string; bgColor: string }> = {
  pending: { icon: Clock, color: "text-yellow-600", label: "Pending", bgColor: "bg-yellow-100" },
  paid: { icon: CheckCircle, color: "text-green-600", label: "Paid", bgColor: "bg-green-100" },
  in_production: { icon: Package, color: "text-blue-600", label: "In Production", bgColor: "bg-blue-100" },
  printed: { icon: Package, color: "text-purple-600", label: "Printed", bgColor: "bg-purple-100" },
  shipped: { icon: Truck, color: "text-indigo-600", label: "Shipped", bgColor: "bg-indigo-100" },
  delivered: { icon: CheckCircle, color: "text-green-700", label: "Delivered", bgColor: "bg-green-200" },
  cancelled: { icon: Clock, color: "text-red-600", label: "Cancelled", bgColor: "bg-red-100" },
};

function getProductIcon(productName: string) {
  const name = productName?.toLowerCase() || "";
  if (name.includes("sticker")) return <Sticker className="h-6 w-6 text-orange-500" />;
  if (name.includes("business") || name.includes("card")) return <CreditCard className="h-6 w-6 text-blue-500" />;
  if (name.includes("flyer") || name.includes("poster")) return <FileImage className="h-6 w-6 text-green-500" />;
  return <Package className="h-6 w-6 text-gray-500" />;
}

export default function OrderDetail() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: [`/api/orders/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json();
    },
    enabled: isAuthenticated && !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background">
        <div className="container mx-auto px-4 py-8 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">Order Not Found</h2>
          <p className="text-gray-500 dark:text-muted-foreground mb-6">
            This order doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Link href="/orders">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status || "pending"] || statusConfig.pending;
  const StatusIcon = status.icon;
  const shippingAddress = order.shippingAddress as any;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container mx-auto px-4 py-8 pb-16 md:pb-20">
        <Link href="/orders">
          <Button variant="ghost" className="mb-6" data-testid="button-back-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
              Order #{order.orderNumber || order.id}
            </h1>
            <p className="text-gray-500 dark:text-muted-foreground flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-2" />
              Placed on{" "}
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }) : "N/A"}
            </p>
          </div>
          <Badge className={`${status.bgColor} ${status.color} px-4 py-2 text-sm`} data-testid="badge-order-status">
            <StatusIcon className="h-4 w-4 mr-2" />
            {status.label}
          </Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 bg-gray-50 dark:bg-muted rounded-lg"
                      data-testid={`order-item-${item.id}`}
                    >
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-white dark:bg-background rounded-lg flex items-center justify-center flex-shrink-0 border overflow-hidden">
                          {item.design?.previewUrl ? (
                            <img src={item.design.previewUrl} alt="Design preview" className="w-full h-full object-cover" />
                          ) : (
                            getProductIcon(item.product?.name || "")
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-foreground">
                            {item.product?.name || "Product"}
                          </h4>
                          {item.design?.name && (
                            <p className="text-sm text-gray-500 dark:text-muted-foreground">
                              Design: {item.design.name}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {Object.entries(item.selectedOptions).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {String(value)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-foreground">
                            {formatPrice(parseFloat(item.unitPrice) * item.quantity)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-muted-foreground">
                            {formatPrice(item.unitPrice)} each
                          </p>
                        </div>
                      </div>
                      
                      {item.design && (item.design.highResExportUrl || item.design.customShapeUrl) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            <Image className="h-3 w-3" />
                            Print-Ready Files
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.design.highResExportUrl && (
                              <a
                                href={item.design.highResExportUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                data-testid={`download-highres-${item.id}`}
                              >
                                <Button size="sm" variant="outline" className="gap-1">
                                  <Download className="h-3 w-3" />
                                  High-Res Design
                                </Button>
                              </a>
                            )}
                            {item.design.customShapeUrl && (
                              <a
                                href={item.design.customShapeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                data-testid={`download-shape-${item.id}`}
                              >
                                <Button size="sm" variant="outline" className="gap-1">
                                  <Download className="h-3 w-3" />
                                  Custom Shape
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {order.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-indigo-50 dark:bg-indigo-950 rounded-lg p-4">
                    <p className="font-medium text-indigo-900 dark:text-indigo-100">
                      Tracking Number: {order.trackingNumber}
                    </p>
                    {order.trackingCarrier && (
                      <p className="text-indigo-700 dark:text-indigo-300 text-sm mt-1">
                        Carrier: {order.trackingCarrier}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-700 dark:text-muted-foreground">
                    <p className="font-medium text-gray-900 dark:text-foreground">
                      {shippingAddress.name}
                    </p>
                    <p>{shippingAddress.street}</p>
                    {shippingAddress.street2 && <p>{shippingAddress.street2}</p>}
                    <p>
                      {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
                    </p>
                    <p>{shippingAddress.country}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-muted-foreground">Shipping</span>
                    <span className="font-medium">{formatPrice(order.shippingCost || "0")}</span>
                  </div>
                  {parseFloat(order.discountAmount || "0") > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(order.discountAmount || "0")}</span>
                    </div>
                  )}
                  {parseFloat(order.taxAmount || "0") > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-muted-foreground">Tax</span>
                      <span className="font-medium">{formatPrice(order.taxAmount || "0")}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-muted-foreground">{order.notes}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-muted-foreground text-sm mb-4">
                  Have questions about your order? Our support team is here to help.
                </p>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    data-testid="button-contact-support"
                    onClick={() => window.location.href = 'tel:602-554-5338'}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call (602) 554-5338
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-muted-foreground" 
                    data-testid="button-email-support"
                    onClick={() => window.location.href = 'mailto:info@stickybanditos.com'}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
