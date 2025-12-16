"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";

export default function OrdersClient() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const r = await fetch("/api/orders", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      {isLoading && <p className="text-gray-500">Loading…</p>}
      <div className="space-y-4">
        {orders.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`} className="block">
            <div className="border rounded-xl p-4 hover:shadow-md bg-white">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">Order #{o.id}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatPrice(o.totalAmount)}</div>
                  <div className="text-xs capitalize text-gray-500">{o.status}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {!isLoading && orders.length === 0 && (
          <div className="text-gray-500 text-center">No orders yet.</div>
        )}
      </div>
    </div>
  );
}
