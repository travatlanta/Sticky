"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart, Eye, X, RefreshCw, Truck, Palette, User, Mail, Phone, MapPin, DollarSign, Download, FileImage, Package, Trash2, ZoomIn, FileText, Send, Plus } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { jsPDF } from "jspdf";

interface OrderUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

interface Order {
  id: number;
  orderNumber?: string;
  userId: string;
  status: string;
  subtotal: string;
  shippingCost: string;
  taxAmount?: string;
  discountAmount?: string;
  totalAmount: string;
  trackingNumber: string | null;
  trackingCarrier?: string | null;
  notes?: string | null;
  createdAt: string;
  shippingAddress: any;
  billingAddress?: any;
  items?: any[];
  user?: OrderUser | null;
}

const statusOptions = [
  "pending_payment",
  "pending",
  "paid",
  "in_production",
  "printed",
  "shipped",
  "delivered",
  "cancelled",
];

const statusColors: Record<string, string> = {
  pending_payment: "bg-orange-100 text-orange-800",
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  in_production: "bg-purple-100 text-purple-800",
  printed: "bg-indigo-100 text-indigo-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [emailDeliveries, setEmailDeliveries] = useState<any[]>([]);
  const [emailDeliveriesLoading, setEmailDeliveriesLoading] = useState(false);
  const [emailDeliveriesError, setEmailDeliveriesError] = useState<string | null>(null);
  const [emailDeliveriesWarning, setEmailDeliveriesWarning] = useState<string | null>(null);

  useEffect(() => {
  const orderId = selectedOrder?.id;
  
  // Reset when closing the modal
  if (!orderId) {
    setEmailDeliveries([]);
    setEmailDeliveriesWarning(null);
    setEmailDeliveriesError(null);
    setEmailDeliveriesLoading(false);
    return;
  }
  
  let cancelled = false;
  
  async function loadEmailDeliveries() {
    try {
      setEmailDeliveriesLoading(true);
      setEmailDeliveriesError(null);
      setEmailDeliveriesWarning(null);
  
      const res = await fetch(`/api/admin/email-deliveries?orderId=${orderId}`);
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load email deliveries");
      }
  
      if (!cancelled) {
        if (data?.warning) {
          setEmailDeliveriesWarning(data.warning);
        }
        setEmailDeliveries(Array.isArray(data?.deliveries) ? data.deliveries : []);
      }
    } catch (err: any) {
      if (!cancelled) {
        setEmailDeliveriesError(err?.message || "Failed to load email deliveries");
        setEmailDeliveries([]);
      }
    } finally {
      if (!cancelled) {
        setEmailDeliveriesLoading(false);
      }
    }
  }
  
  loadEmailDeliveries();
  
  return () => {
    cancelled = true;
  };
  }, [selectedOrder?.id]);

  const [downloadFormats, setDownloadFormats] = useState<Record<number, string>>({});
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDownload = async (url: string, itemId: number, designName: string, formatOverride?: string) => {
    const format = formatOverride || downloadFormats[itemId] || 'pdf';
    setDownloading(prev => ({ ...prev, [itemId]: true }));
    
    try {
      const downloadUrl = `/api/admin/design-download?url=${encodeURIComponent(url)}&format=${format}&filename=${encodeURIComponent(designName)}`;
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const contentType = response.headers.get('content-type') || '';
      
      // Handle PDF data (client-side PDF generation)
      if (contentType.includes('application/json') && format === 'pdf') {
        const data = await response.json();
        if (data.type === 'pdf-data') {
          // Generate PDF client-side using jspdf
          const { imageBase64, width, height, filename } = data;
          
          // Calculate PDF dimensions at 300 DPI (points = pixels * 72 / 300)
          const widthPt = width * 72 / 300;
          const heightPt = height * 72 / 300;
          
          const pdf = new jsPDF({
            orientation: width > height ? 'landscape' : 'portrait',
            unit: 'pt',
            format: [widthPt, heightPt],
          });
          
          const imgData = `data:image/png;base64,${imageBase64}`;
          pdf.addImage(imgData, 'PNG', 0, 0, widthPt, heightPt);
          pdf.save(`${filename}.pdf`);
          
          toast({ title: 'Downloaded as PDF (300 DPI)' });
          return;
        }
      }
      
      // Handle regular binary downloads
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
      const downloadFilename = filenameMatch?.[1] || `${designName.replace(/[^a-z0-9]/gi, '_')}.${format === 'original' ? 'png' : format}`;
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      
      toast({ title: format === 'original' ? 'Downloaded original file' : `Downloaded as ${format.toUpperCase()}` });
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Download failed', variant: 'destructive' });
    } finally {
      setDownloading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const { data: orderDetails } = useQuery<Order>({
    queryKey: ["/api/admin/orders", selectedOrder?.id],
    enabled: !!selectedOrder,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Order> }) => {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order updated successfully" });
    },
    onError: () => toast({ title: "Failed to update order", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete order", variant: "destructive" }),
  });

  const handleDeleteOrder = (orderId: number) => {
    if (window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      deleteMutation.mutate(orderId);
    }
  };

  const resendReceiptMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await fetch(`/api/admin/orders/${orderId}/resend-receipt`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend receipt");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: data.message || "Receipt sent successfully" });
    },
    onError: (error: Error) => toast({ title: error.message || "Failed to resend receipt", variant: "destructive" }),
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 text-sm md:text-base">Manage customer orders</p>
          </div>
          <Link href="/admin/orders/create">
            <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-create-manual-order">
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </Link>
        </div>

        {/* Help Guide */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Quick Guide
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Update Status</span><br /><span className="text-gray-600">Use dropdown to change order status</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Eye className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">View Details</span><br /><span className="text-gray-600">Eye icon shows full order info</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Truck className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Add Tracking</span><br /><span className="text-gray-600">Enter tracking # for shipments</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Palette className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Status Colors</span><br /><span className="text-gray-600">Yellow/Blue/Purple/Green by stage</span></p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => {
              const customerName = order.user?.firstName && order.user?.lastName 
                ? `${order.user.firstName} ${order.user.lastName}`.trim()
                : order.shippingAddress?.name || 'Guest Customer';
              const customerCity = order.shippingAddress?.city && order.shippingAddress?.state 
                ? `${order.shippingAddress.city}, ${order.shippingAddress.state}`
                : '';
              const itemCount = order.items?.length || 0;
              
              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all" 
                  onClick={() => setSelectedOrder(order)}
                  data-testid={`order-card-${order.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">#{order.orderNumber || order.id}</span>
                        <span className="text-lg font-semibold text-green-600">{formatPrice(order.totalAmount)}</span>
                        <Badge className={statusColors[order.status] || "bg-gray-100"}>
                          {order.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          <span className="font-medium">{customerName}</span>
                        </span>
                        {customerCity && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <MapPin className="h-3.5 w-3.5" />
                            {customerCity}
                          </span>
                        )}
                        {itemCount > 0 && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <Package className="h-3.5 w-3.5" />
                            {itemCount} item{itemCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateMutation.mutate({ id: order.id, data: { status: e.target.value as any } })
                        }
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
                          statusColors[order.status] || "bg-gray-100 text-gray-800"
                        }`}
                        data-testid={`select-status-${order.id}`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-${order.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500">Orders will appear here when customers place them</p>
          </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-xl font-bold">Order #{selectedOrder.orderNumber || selectedOrder.id}</h2>
                  <p className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[selectedOrder.status] || "bg-gray-100"}>
                    {selectedOrder.status.replace("_", " ")}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resendReceiptMutation.mutate(selectedOrder.id)}
                    disabled={resendReceiptMutation.isPending}
                    data-testid="button-resend-receipt"
                  >
                    {resendReceiptMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Resend Receipt
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Information & Addresses - All in one row */}
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Customer Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Customer
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="font-medium">
                          {orderDetails?.user?.firstName || orderDetails?.user?.lastName 
                            ? `${orderDetails?.user?.firstName || ''} ${orderDetails?.user?.lastName || ''}`.trim()
                            : selectedOrder.shippingAddress?.name || 'Guest Customer'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium break-all">
                          {orderDetails?.user?.email || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium">
                          {orderDetails?.user?.phone || selectedOrder.shippingAddress?.phone || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      Billing Address
                    </h3>
                    <div className="text-sm">
                      {(() => {
                        const addr = selectedOrder.billingAddress || selectedOrder.shippingAddress;
                        return addr && typeof addr === "object" ? (
                          <>
                            {addr.name && <p className="font-medium">{addr.name}</p>}
                            {(addr.address1 || addr.street) && <p>{addr.address1 || addr.street}</p>}
                            {addr.address2 && <p>{addr.address2}</p>}
                            <p>
                              {addr.city}, {addr.state} {addr.zip || addr.zipCode}
                            </p>
                            {addr.country && <p>{addr.country}</p>}
                          </>
                        ) : (
                          <p className="text-gray-400">Not provided</p>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Truck className="h-5 w-5 text-gray-600" />
                      Shipping Address
                    </h3>
                    <div className="text-sm">
                      {selectedOrder.shippingAddress && typeof selectedOrder.shippingAddress === "object" ? (
                        <>
                          {selectedOrder.shippingAddress.name && (
                            <p className="font-medium">{selectedOrder.shippingAddress.name}</p>
                          )}
                          {(selectedOrder.shippingAddress.address1 || selectedOrder.shippingAddress.street) && (
                            <p>{selectedOrder.shippingAddress.address1 || selectedOrder.shippingAddress.street}</p>
                          )}
                          {selectedOrder.shippingAddress.address2 && (
                            <p>{selectedOrder.shippingAddress.address2}</p>
                          )}
                          <p>
                            {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{" "}
                            {selectedOrder.shippingAddress.zip || selectedOrder.shippingAddress.zipCode}
                          </p>
                          {selectedOrder.shippingAddress.country && (
                            <p>{selectedOrder.shippingAddress.country}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-400">Not provided</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email Delivery */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Email Delivery</h3>

                  {emailDeliveriesWarning && (
                    <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                      {emailDeliveriesWarning}
                    </div>
                  )}

                  {emailDeliveriesLoading ? (
                    <p className="text-sm text-gray-600">Loading email delivery status...</p>
                  ) : emailDeliveriesError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      {emailDeliveriesError}
                    </div>
                  ) : emailDeliveries.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      No email delivery records for this order yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">Type</th>
                            <th className="px-3 py-2 text-left font-medium">To</th>
                            <th className="px-3 py-2 text-left font-medium">Status</th>
                            <th className="px-3 py-2 text-left font-medium">Attempts</th>
                            <th className="px-3 py-2 text-left font-medium">Last Attempt</th>
                            <th className="px-3 py-2 text-left font-medium">Sent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {emailDeliveries.map((d: any) => (
                            <tr key={d.id} className="border-t border-gray-100">
                              <td className="px-3 py-2">{d.type}</td>
                              <td className="px-3 py-2">{d.toEmail}</td>
                              <td className="px-3 py-2">
                <span
                  className={
                    d.status === "sent"
                      ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                      : d.status === "failed"
                      ? "inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
                      : "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                  }
                >
                  {d.status}
                </span>
                              </td>
                              <td className="px-3 py-2">{d.attempts}</td>
                              <td className="px-3 py-2">
                {d.lastAttemptAt ? formatDate(d.lastAttemptAt) : "—"}
                              </td>
                              <td className="px-3 py-2">
                {d.sentAt ? formatDate(d.sentAt) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

{/* Order Items */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-600" />
                    Order Items ({orderDetails?.items?.length || selectedOrder.items?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {(orderDetails?.items || selectedOrder.items || []).map((item: any) => (
                      <div key={item.id} className="bg-white rounded-lg border p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.product?.name || `Product #${item.productId}`}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>Qty: <strong>{item.quantity}</strong></span>
                              <span>Unit Price: <strong>{formatPrice(item.unitPrice)}</strong></span>
                              <span className="text-green-600 font-semibold">
                                Subtotal: {formatPrice(parseFloat(item.unitPrice) * item.quantity)}
                              </span>
                            </div>
                            {(item.resolvedOptions || item.selectedOptions) && Object.keys(item.resolvedOptions || item.selectedOptions).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Object.entries(item.resolvedOptions || item.selectedOptions).map(([key, value]) => (
                                  <Badge key={key} variant="outline" className="text-xs capitalize">
                                    {key}: {String(value)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Design Files Section */}
                        {item.design && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                              <Palette className="h-4 w-4 text-orange-500" />
                              Customer Design: {item.design.name || 'Untitled'}
                              {item.product?.name?.toLowerCase().includes('die') || item.product?.name?.toLowerCase().includes('kiss') ? (
                                <Badge className="ml-2 text-xs bg-purple-100 text-purple-700">
                                  Transparent BG
                                </Badge>
                              ) : null}
                            </p>
                            <div className="flex flex-wrap items-start gap-4">
                              {/* Design Preview - Click to open modal */}
                              {(item.design.highResExportUrl || item.design.previewUrl) && (() => {
                                const previewUrl = item.design.previewUrl || item.design.highResExportUrl;
                                const isPdf = previewUrl?.toLowerCase().includes('.pdf');
                                
                                if (isPdf) {
                                  // Show PDF placeholder for PDF files
                                  return (
                                    <div className="w-24 h-24 flex flex-col items-center justify-center bg-red-50 rounded-lg border-2 border-red-200">
                                      <FileText className="h-10 w-10 text-red-500" />
                                      <span className="text-xs text-red-600 mt-1 font-medium">PDF File</span>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div 
                                    className="relative cursor-pointer group"
                                    onClick={() => setPreviewImage({
                                      url: `/api/admin/design-download?url=${encodeURIComponent(item.design.highResExportUrl || item.design.previewUrl)}&format=preview`,
                                      name: item.design.name || 'Design Preview'
                                    })}
                                  >
                                    <img 
                                      src={`/api/admin/design-download?url=${encodeURIComponent(previewUrl)}&format=preview`}
                                      alt="Design preview" 
                                      className="w-24 h-24 object-contain bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] rounded-lg border-2 border-gray-200"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                      <ZoomIn className="h-6 w-6 text-white" />
                                    </div>
                                  </div>
                                );
                              })()}
                              
                              {/* Download with Format Selection */}
                              <div className="flex flex-col gap-2">
                                {(item.design.highResExportUrl || item.design.previewUrl) && (
                                  <>
                                    {/* Check if file is a special format that can't be converted */}
                                    {(() => {
                                      const url = item.design.highResExportUrl || item.design.previewUrl || '';
                                      const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
                                      const isSpecialFormat = ['eps', 'cdr', 'ai', 'psd'].includes(ext);
                                      
                                      if (isSpecialFormat) {
                                        return (
                                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-1">
                                            <p className="text-xs text-amber-700 font-medium">
                                              {ext.toUpperCase()} files can only be downloaded in their original format (no conversion available)
                                            </p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                    <div className="flex items-center gap-2">
                                      {/* Only show format selection for convertible files */}
                                      {(() => {
                                        const url = item.design.highResExportUrl || item.design.previewUrl || '';
                                        const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
                                        const isSpecialFormat = ['eps', 'cdr', 'ai', 'psd', 'pdf'].includes(ext);
                                        
                                        if (isSpecialFormat) {
                                          return null; // Hide format selector for special formats
                                        }
                                        
                                        return (
                                          <Select
                                            value={downloadFormats[item.id] || 'pdf'}
                                            onValueChange={(value) => setDownloadFormats(prev => ({ ...prev, [item.id]: value }))}
                                          >
                                            <SelectTrigger className="w-28" data-testid={`select-format-${item.id}`}>
                                              <SelectValue placeholder="Format" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pdf">PDF</SelectItem>
                                              <SelectItem value="png">PNG</SelectItem>
                                              <SelectItem value="tiff">TIFF</SelectItem>
                                              <SelectItem value="jpg">JPG</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        );
                                      })()}
                                      <Button
                                        onClick={() => {
                                          const url = item.design.highResExportUrl || item.design.previewUrl || '';
                                          const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
                                          const isSpecialFormat = ['eps', 'cdr', 'ai', 'psd', 'pdf'].includes(ext);
                                          handleDownload(
                                            url,
                                            item.id,
                                            item.design.name || 'design',
                                            isSpecialFormat ? 'original' : undefined
                                          );
                                        }}
                                        disabled={downloading[item.id]}
                                        className="bg-orange-500 hover:bg-orange-600"
                                        data-testid={`button-download-${item.id}`}
                                      >
                                        {downloading[item.id] ? (
                                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                          <Download className="h-4 w-4 mr-2" />
                                        )}
                                        {(() => {
                                          const url = item.design.highResExportUrl || item.design.previewUrl || '';
                                          const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
                                          const isSpecialFormat = ['eps', 'cdr', 'ai', 'psd', 'pdf'].includes(ext);
                                          return isSpecialFormat ? `Download ${ext.toUpperCase()}` : 'Download';
                                        })()}
                                      </Button>
                                    </div>
                                    <div className="text-xs text-gray-500 space-y-1">
                                      <p>PNG/TIFF preserve transparency</p>
                                      <p className="text-amber-600">EPS, CDR, AI, PSD, PDF files download as-is (no conversion available)</p>
                                    </div>
                                  </>
                                )}
                                {item.design.customShapeUrl && (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleDownload(
                                      item.design.customShapeUrl,
                                      item.id + 1000,
                                      `${item.design.name || 'design'}_diecut`,
                                      'original'
                                    )}
                                    disabled={downloading[item.id + 1000]}
                                    className="text-blue-700 border-blue-300"
                                  >
                                    <FileImage className="h-4 w-4 mr-2" />
                                    Download Die-Cut Shape
                                  </Button>
                                )}
                                {item.printFileUrl && (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleDownload(
                                      item.printFileUrl,
                                      item.id + 2000,
                                      `${item.design?.name || 'design'}_production`,
                                      'original'
                                    )}
                                    disabled={downloading[item.id + 2000]}
                                    className="text-green-700 border-green-300"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Production File
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {(!orderDetails?.items?.length && !selectedOrder.items?.length) && (
                      <div className="text-center py-4 text-gray-500">
                        No items found for this order
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary & Shipping/Tracking - Side by Side */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Financial Summary */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Financial Summary
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatPrice(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">{formatPrice(selectedOrder.shippingCost || '0')}</span>
                      </div>
                      {parseFloat(selectedOrder.taxAmount || '0') > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax</span>
                          <span className="font-medium">{formatPrice(selectedOrder.taxAmount || '0')}</span>
                        </div>
                      )}
                      {parseFloat(selectedOrder.discountAmount || '0') > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span className="font-medium">-{formatPrice(selectedOrder.discountAmount || '0')}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-green-200 text-lg font-bold">
                        <span>Total</span>
                        <span className="text-green-700">{formatPrice(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tracking & Shipping */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Truck className="h-5 w-5 text-indigo-600" />
                      Shipping & Tracking
                    </h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Tracking Number</label>
                        <input
                          type="text"
                          value={selectedOrder.trackingNumber || ""}
                          onChange={(e) =>
                            setSelectedOrder({ ...selectedOrder, trackingNumber: e.target.value })
                          }
                          placeholder="Enter tracking number"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      <Button
                        onClick={() =>
                          updateMutation.mutate({
                            id: selectedOrder.id,
                            data: { trackingNumber: selectedOrder.trackingNumber },
                          })
                        }
                        className="w-full"
                      >
                        Save Tracking
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Order Notes */}
                {selectedOrder.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Order Notes</h3>
                    <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{previewImage?.name || 'Design Preview'}</DialogTitle>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#ffffff_0%_50%)] bg-[length:20px_20px]">
            {previewImage && (
              <img 
                src={previewImage.url} 
                alt={previewImage.name} 
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}