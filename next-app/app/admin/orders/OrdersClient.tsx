"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart, Eye, X, RefreshCw, Truck, Palette, User, Mail, Phone, MapPin, DollarSign, Download, FileImage, Package, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface OrderUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

interface Order {
  id: number;
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
  "pending",
  "paid",
  "in_production",
  "printed",
  "shipped",
  "delivered",
  "cancelled",
];

const statusColors: Record<string, string> = {
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
  const [downloadFormats, setDownloadFormats] = useState<Record<number, string>>({});
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDownload = async (url: string, itemId: number, designName: string) => {
    const format = downloadFormats[itemId] || 'png';
    setDownloading(prev => ({ ...prev, [itemId]: true }));
    const fileName = designName.replace(/[^a-z0-9]/gi, '_');
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Load image for all conversions
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });

      if (format === 'pdf') {
        // Convert to PDF using jsPDF
        const imgWidth = img.width;
        const imgHeight = img.height;
        
        // Create PDF with image dimensions (in mm, assuming 72 DPI)
        const pxToMm = 0.264583;
        const pdfWidth = imgWidth * pxToMm;
        const pdfHeight = imgHeight * pxToMm;
        
        const pdf = new jsPDF({
          orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [pdfWidth, pdfHeight],
        });
        
        // Draw image on canvas to get data URL
        const canvas = document.createElement('canvas');
        canvas.width = imgWidth;
        canvas.height = imgHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
        const imgData = canvas.toDataURL('image/png');
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${fileName}.pdf`);
        
      } else if (format === 'jpg') {
        // Convert to JPEG with white background
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
        
        canvas.toBlob((newBlob) => {
          if (newBlob) {
            const downloadUrl = URL.createObjectURL(newBlob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${fileName}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
          }
        }, 'image/jpeg', 0.95);
        
      } else {
        // PNG - download original or convert to PNG
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
        
        canvas.toBlob((newBlob) => {
          if (newBlob) {
            const downloadUrl = URL.createObjectURL(newBlob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${fileName}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
          }
        }, 'image/png');
      }
      
      // Clean up
      URL.revokeObjectURL(img.src);
      toast({ title: `Downloaded as ${format.toUpperCase()}` });
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
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 text-sm md:text-base">Manage customer orders</p>
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
                        <span className="font-bold text-gray-900">#{order.id}</span>
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
                  <h2 className="text-xl font-bold">Order #{selectedOrder.id}</h2>
                  <p className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[selectedOrder.status] || "bg-gray-100"}>
                    {selectedOrder.status.replace("_", " ")}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Customer Information
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="font-medium">
                          {orderDetails?.user?.firstName || orderDetails?.user?.lastName 
                            ? `${orderDetails?.user?.firstName || ''} ${orderDetails?.user?.lastName || ''}`.trim()
                            : selectedOrder.shippingAddress?.name || 'Guest Customer'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium text-sm">
                          {orderDetails?.user?.email || 'Not provided'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium">
                          {orderDetails?.user?.phone || selectedOrder.shippingAddress?.phone || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing & Shipping Addresses - Side by Side */}
                {selectedOrder.shippingAddress && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Billing Address */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-600" />
                        Billing Address
                      </h3>
                      <div className="text-sm">
                        {(() => {
                          const addr = selectedOrder.billingAddress || selectedOrder.shippingAddress;
                          return typeof addr === "object" ? (
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
                            <p>{String(addr)}</p>
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
                        {typeof selectedOrder.shippingAddress === "object" ? (
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
                          <p>{String(selectedOrder.shippingAddress)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Object.entries(item.selectedOptions).map(([key, value]) => (
                                  <Badge key={key} variant="outline" className="text-xs">
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
                              {item.design.highResExportUrl && (
                                <Badge variant="outline" className="ml-2 text-xs uppercase">
                                  {item.design.highResExportUrl.split('.').pop()?.split('?')[0] || 'PNG'}
                                </Badge>
                              )}
                            </p>
                            <div className="flex flex-wrap items-start gap-4">
                              {/* Design Preview */}
                              {(item.design.highResExportUrl || item.design.previewUrl) && (
                                <a 
                                  href={item.design.highResExportUrl || item.design.previewUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img 
                                    src={item.design.highResExportUrl || item.design.previewUrl} 
                                    alt="Design preview" 
                                    className="w-24 h-24 object-contain bg-gray-100 rounded-lg border-2 border-gray-200"
                                  />
                                </a>
                              )}
                              
                              {/* Download with Format Selection */}
                              <div className="flex flex-col gap-2">
                                {item.design.highResExportUrl && (
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={downloadFormats[item.id] || 'png'}
                                      onValueChange={(value) => setDownloadFormats(prev => ({ ...prev, [item.id]: value }))}
                                    >
                                      <SelectTrigger className="w-28" data-testid={`select-format-${item.id}`}>
                                        <SelectValue placeholder="Format" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="png">PNG</SelectItem>
                                        <SelectItem value="jpg">JPG</SelectItem>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      onClick={() => handleDownload(
                                        item.design.highResExportUrl,
                                        item.id,
                                        item.design.name || 'design'
                                      )}
                                      disabled={downloading[item.id]}
                                      className="bg-orange-500 hover:bg-orange-600"
                                      data-testid={`button-download-${item.id}`}
                                    >
                                      {downloading[item.id] ? (
                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                      ) : (
                                        <Download className="h-4 w-4 mr-2" />
                                      )}
                                      Download
                                    </Button>
                                  </div>
                                )}
                                {item.design.customShapeUrl && (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleDownload(
                                      item.design.customShapeUrl,
                                      item.id + 1000,
                                      `${item.design.name || 'design'}_diecut`
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
                                      `${item.design?.name || 'design'}_production`
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
    </AdminLayout>
  );
}
