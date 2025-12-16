"use client";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";

interface AdminOrder {
  id: number;
  status: string;
  totalAmount: string;
  createdAt: string;
  shippingAddress?: { firstName?: string; lastName?: string; };
}

export default function AdminOrders() {
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  const { data: orders = [], isLoading } = useQuery<AdminOrder[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const r = await fetch("/api/admin/orders");
      if (!r.ok) throw new Error("Failed to load orders");
      return r.json();
    }
  });

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>

        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="grid grid-cols-4 gap-4 px-4 py-3 text-sm font-semibold bg-gray-50">
            <div>Customer</div><div>Date</div><div>Status</div><div className="text-right">Total</div>
          </div>

          {isLoading && <div className="p-4 text-gray-500">Loading…</div>}

          {orders.map(o => (
            <div key={o.id}
              onClick={() => setSelected(o)}
              className="grid grid-cols-4 gap-4 px-4 py-4 border-t cursor-pointer hover:bg-gray-50">
              <div>
                <div className="font-medium">
                  {o.shippingAddress?.firstName || "—"} {o.shippingAddress?.lastName || ""}
                </div>
                <div className="text-xs text-gray-500">Order #{o.id}</div>
              </div>
              <div>{new Date(o.createdAt).toLocaleDateString()}</div>
              <div className="capitalize">{o.status}</div>
              <div className="text-right font-semibold">{formatPrice(o.totalAmount)}</div>
            </div>
          ))}

          {!isLoading && orders.length === 0 && (
            <div className="p-6 text-center text-gray-500">No orders yet</div>
          )}
        </div>

        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative">
              <button className="absolute top-3 right-3" onClick={() => setSelected(null)}>✕</button>
              <h2 className="text-xl font-bold mb-4">Order #{selected.id}</h2>
              <p className="text-sm text-gray-600 mb-2">
                {selected.shippingAddress?.firstName} {selected.shippingAddress?.lastName}
              </p>
              <p className="mb-4">Total: <strong>{formatPrice(selected.totalAmount)}</strong></p>
              <p className="text-sm text-gray-500 mb-2">Full details are shown on the order detail page.</p>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600">Debug (full record)</summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
{JSON.stringify(selected, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
