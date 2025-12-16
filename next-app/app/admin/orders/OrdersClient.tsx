
"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { formatPrice } from "@/lib/utils";

export default function AdminOrders() {
  const router = useRouter();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/admin/orders"],
  });

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>

        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="grid grid-cols-4 gap-4 px-4 py-3 text-sm font-semibold bg-gray-50">
            <div>Customer</div>
            <div>Date</div>
            <div>Status</div>
            <div className="text-right">Total</div>
          </div>

          {isLoading && (
            <div className="p-4 text-gray-500">Loading orders…</div>
          )}

          {orders.map((order: any) => (
            <div
              key={order.id}
              onClick={() => router.push(`/admin/orders/${order.id}`)}
              className="grid grid-cols-4 gap-4 px-4 py-4 text-sm border-t cursor-pointer hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">
                  {order.shippingAddress?.firstName || "—"}{" "}
                  {order.shippingAddress?.lastName || ""}
                </div>
                <div className="text-xs text-gray-500">
                  Order #{order.id}
                </div>
              </div>

              <div>
                {new Date(order.createdAt).toLocaleDateString()}
              </div>

              <div className="capitalize">
                {order.status}
              </div>

              <div className="text-right font-semibold">
                {formatPrice(order.totalAmount)}
              </div>
            </div>
          ))}

          {orders.length === 0 && !isLoading && (
            <div className="p-6 text-center text-gray-500">
              No orders yet
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
