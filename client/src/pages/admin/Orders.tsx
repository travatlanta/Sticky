import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { formatPrice, formatOrderNumber } from "@/lib/utils";
import { ShoppingCart, Eye, X, RefreshCw, Truck, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: number;
  userId: string;
  status: string;
  subtotal: string;
  shippingCost: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  trackingNumber: string | null;
  createdAt: string;
  shippingAddress: any;
  items?: any[];
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm" data-testid={`order-card-${order.id}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-gray-900">{formatOrderNumber(order.id)}</span>
                      <span className="text-gray-900 font-medium">{formatPrice(order.totalAmount)}</span>
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateMutation.mutate({ id: order.id, data: { status: e.target.value as any } })
                      }
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 ${
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
                      onClick={() => setSelectedOrder(order)}
                      data-testid={`button-view-${order.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Order {formatOrderNumber(selectedOrder.id)}</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium capitalize">{selectedOrder.status.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-gray-500 font-medium mb-3">Order Summary</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">{formatPrice(selectedOrder.shippingCost || "0")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (8.6%)</span>
                    <span className="font-medium">{formatPrice(selectedOrder.taxAmount || "0")}</span>
                  </div>
                  {parseFloat(selectedOrder.discountAmount || "0") > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(selectedOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold text-orange-600">{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                </div>

                {selectedOrder.shippingAddress && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Shipping Address</p>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      {typeof selectedOrder.shippingAddress === "object" ? (
                        <>
                          <p>{selectedOrder.shippingAddress.name}</p>
                          <p>{selectedOrder.shippingAddress.street}</p>
                          <p>
                            {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{" "}
                            {selectedOrder.shippingAddress.zip}
                          </p>
                        </>
                      ) : (
                        <p>{JSON.stringify(selectedOrder.shippingAddress)}</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500 mb-2">Tracking Number</p>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={selectedOrder.trackingNumber || ""}
                      onChange={(e) =>
                        setSelectedOrder({ ...selectedOrder, trackingNumber: e.target.value })
                      }
                      placeholder="Enter tracking number"
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    <Button
                      onClick={() =>
                        updateMutation.mutate({
                          id: selectedOrder.id,
                          data: { trackingNumber: selectedOrder.trackingNumber },
                        })
                      }
                    >
                      Save
                    </Button>
                  </div>
                </div>

                {orderDetails?.items && orderDetails.items.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Order Items</p>
                    <div className="bg-gray-50 rounded-lg divide-y">
                      {orderDetails.items.map((item: any) => (
                        <div key={item.id} className="p-3">
                          <div className="flex justify-between mb-2">
                            <div>
                              <p className="font-medium">{item.product?.name || `Product #${item.productId}`}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-medium">{formatPrice(item.unitPrice)}</p>
                          </div>
                          {item.design && (
                            <div className="mt-2 bg-white rounded-lg border p-2">
                              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <Palette className="h-3 w-3" /> Customer Design
                              </p>
                              <div className="flex items-start gap-3">
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
                                      className="w-20 h-20 object-contain bg-gray-100 rounded border"
                                    />
                                  </a>
                                )}
                                <div className="flex-1 text-xs">
                                  <p className="text-gray-700 font-medium">{item.design.name || "Untitled Design"}</p>
                                  {item.design.highResExportUrl && (
                                    <a 
                                      href={item.design.highResExportUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-orange-600 hover:underline inline-flex items-center gap-1 mt-1"
                                    >
                                      <Eye className="h-3 w-3" /> View High-Res
                                    </a>
                                  )}
                                  {item.design.customShapeUrl && (
                                    <a 
                                      href={item.design.customShapeUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-1 ml-3"
                                    >
                                      <Eye className="h-3 w-3" /> Custom Shape
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
