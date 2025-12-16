"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";

export default function OrderDetailClient() {
  const { id } = useParams();

  const { data: order } = useQuery({
    queryKey: ["/api/orders", id],
    queryFn: async () => {
      const r = await fetch(`/api/orders/${id}`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  if (!order) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Order #{order.id}</h1>

      <div className="bg-white rounded-xl p-4 mb-6">
        <h2 className="font-semibold mb-2">Order Items</h2>
        {order.orderItems.map((item: any) => (
          <div key={item.id} className="border rounded-lg p-3 mb-3">
            <div className="font-medium">{item.product?.name}</div>
            <div className="text-sm text-gray-500">
              Quantity: {item.quantity}
            </div>

            {item.design?.previewUrl && (
              <img
                src={item.design.previewUrl}
                className="h-32 mt-2 rounded"
              />
            )}

            {item.design?.files && (
              <div className="mt-2 flex gap-2">
                {Object.entries(item.design.files).map(([type, url]) => (
                  <a
                    key={type}
                    href={url as string}
                    download
                    className="text-sm underline"
                  >
                    Download {type.toUpperCase()}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4">
        <h2 className="font-semibold mb-2">Order Summary</h2>
        <div className="flex justify-between">
          <span>Total</span>
          <span>{formatPrice(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
