"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { formatPrice } from "@/lib/utils";

export default function AdminOrdersClient() {
  const [selected, setSelected] = useState<any>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const r = await fetch("/api/admin/orders");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>

        <div className="bg-white rounded-xl border">
          {orders.map((o: any) => (
            <div
              key={o.id}
              onClick={() => setSelected(o)}
              className="grid grid-cols-4 gap-4 p-4 border-b cursor-pointer hover:bg-gray-50"
            >
              <div>{o.shippingAddress?.firstName} {o.shippingAddress?.lastName}</div>
              <div>{new Date(o.createdAt).toLocaleDateString()}</div>
              <div>{o.status}</div>
              <div className="text-right">{formatPrice(o.totalAmount)}</div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl">
              <h2 className="text-xl font-bold mb-4">
                Order #{selected.id}
              </h2>

              <h3 className="font-semibold">Customer</h3>
              <p>
                {selected.shippingAddress?.firstName}{" "}
                {selected.shippingAddress?.lastName}
              </p>

              <h3 className="font-semibold mt-4">Items</h3>
              {selected.orderItems?.map((item: any) => (
                <div key={item.id} className="border rounded p-3 mb-2">
                  <div>{item.product?.name}</div>
                  {item.design?.previewUrl && (
                    <img src={item.design.previewUrl} className="h-24 mt-2" />
                  )}
                  {item.design?.files && (
                    <div className="flex gap-2 mt-2">
                      {Object.entries(item.design.files).map(([t, u]) => (
                        <a key={t} href={u as string} download className="underline text-sm">
                          {t.toUpperCase()}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end mt-6">
                <button onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
