
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";

export default function OrdersClient() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {isLoading && <p className="text-gray-500">Loading orders…</p>}

      <div className="space-y-4">
        {orders.map((order: any) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="block"
          >
            <div className="border rounded-xl p-4 hover:shadow-md transition bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">
                    Order #{order.id}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold">
                    {formatPrice(order.totalAmount)}
                  </div>
                  <div className="text-xs capitalize text-gray-500">
                    {order.status}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {orders.length === 0 && !isLoading && (
          <div className="text-center text-gray-500">
            You don’t have any orders yet.
          </div>
        )}
      </div>
    </div>
  );
}
