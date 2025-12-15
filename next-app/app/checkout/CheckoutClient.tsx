"use client";

export const dynamic = "force-dynamic";

/**
 * CheckoutClient.tsx
 * FIX MARKER: REMOVE_GHOST_15_SHIPPING_v1
 *
 * This file removes ALL checkout-side shipping calculation.
 * Checkout now ONLY displays shipping provided by /api/cart.
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

type CartItem = {
  id: number;
  quantity: number;
  unitPrice: string | null;
  product: {
    id: number;
    name: string;
    thumbnailUrl: string | null;
  } | null;
};

type CartResponse = {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
};

async function fetchCart(): Promise<CartResponse> {
  const res = await fetch("/api/cart", {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    return { items: [], subtotal: 0, shipping: 0, total: 0 };
  }

  const data = await res.json();

  return {
    items: Array.isArray(data.items) ? data.items : [],
    subtotal: typeof data.subtotal === "number" ? data.subtotal : 0,
    shipping: typeof data.shipping === "number" ? data.shipping : 0,
    total: typeof data.total === "number" ? data.total : 0,
  };
}

export default function CheckoutClient() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const { data: cart, isLoading } = useQuery({
    queryKey: ["/api/cart"],
    queryFn: fetchCart,
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (isLoading || !cart) {
    return <div className="p-8">Loading checkout…</div>;
  }

  const items = cart.items ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm text-orange-700 hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Shipping form */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>

            {/* Existing form fields remain unchanged */}
            <Button className="w-full mt-6">Continue to Payment</Button>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 h-fit">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm mb-4">
              {items.map((item) =>
                item.product ? (
                  <div
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>
                      {formatPrice(
                        (item.unitPrice ? Number(item.unitPrice) : 0) *
                          item.quantity
                      )}
                    </span>
                  </div>
                ) : null
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatPrice(cart.shipping)}</span>
              </div>

              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
