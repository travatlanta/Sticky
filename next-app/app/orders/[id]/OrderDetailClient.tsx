"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";

export default function OrderDetailClient() {
  const { id } = useParams();

  const { data: order } = useQuery({
    queryKey: ["/api/orders", id],
    queryFn: async () => {
      const r = await fetch(`/api/orders/${id}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  if (!order || !order.items) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">Order #{order.id}</h1>
      <p className="text-gray-500 mb-6">
        Placed on {new Date(order.createdAt).toLocaleDateString()}
      </p>

      <div className="bg-white rounded-xl border p-4 mb-6">
        <h2 className="font-semibold mb-3">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="border rounded-lg p-3 mb-3">
            <div className="font-medium">{item.product?.name}</div>
            <div className="text-sm text-gray-500">
              Quantity: {item.quantity}
            </div>
            {item.design?.previewUrl && (
              <img src={item.design.previewUrl} className="h-32 mt-2 rounded" />
            )}
            {item.design?.files && (
              <div className="mt-2 flex gap-3">
                {Object.entries(item.design.files).map(([t, u]) => (
                  <a key={t} href={u} download className="text-sm underline">
                    {t.toUpperCase()}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6">
        <h2 className="font-semibold mb-2">Shipping Address</h2>
        <p>{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
        <p>{order.shippingAddress?.address1}</p>
        <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}</p>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold mb-2">Order Summary</h2>
        <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{formatPrice(order.taxAmount)}</span></div>
        <div className="flex justify-between"><span>Shipping</span><span>{formatPrice(order.shippingCost)}</span></div>
        <div className="flex justify-between font-bold mt-2"><span>Total</span><span>{formatPrice(order.totalAmount)}</span></div>
      </div>
    </div>
  );
}
