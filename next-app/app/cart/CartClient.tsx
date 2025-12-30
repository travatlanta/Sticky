"use client";

/**
 * CartClient.tsx
 * FIX MARKER: NO_15_SHIPPING_FIX_v1
 *
 * This file intentionally removes any hard-coded $15 shipping fallback.
 * Shipping displayed here is ONLY what /api/cart returns.
 */

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ShoppingBag, ArrowRight, Sticker } from "lucide-react";

type CartItem = {
  id: number;
  quantity: number;
  unitPrice: string | null;
  selectedOptions?: any;
  mediaType?: string | null;
  finishType?: string | null;
  product: {
    id: number;
    name: string;
    slug: string;
    thumbnailUrl: string | null;
  } | null;
  design?: {
    id: number;
    name?: string | null;
    previewUrl?: string | null;
  } | null;
};

const MEDIA_TYPES = ["Vinyl", "Foil", "Holographic"] as const;
const FINISH_TYPES = ["None", "Varnish", "Emboss", "Both"] as const;

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

export default function CartClient() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Force cart to refetch when arriving on /cart (fixes “must refresh to see items”)
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    queryClient.refetchQueries({ queryKey: ["/api/cart"] });
  }, [queryClient]);

  const { data: cart, isLoading } = useQuery({
    queryKey: ["/api/cart"],
    queryFn: fetchCart,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Item removed" });
    },
    onError: () => {
      toast({ title: "Remove failed", variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, mediaType, finishType }: { itemId: number; mediaType?: string; finishType?: string }) => {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mediaType, finishType }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({ title: "Update failed", variant: "destructive" });
    },
  });

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    const allComplete = (cart?.items ?? []).every(
      (item) => item.mediaType && item.finishType
    );
    if (!allComplete) {
      toast({
        title: "Please complete selections",
        description: "Select media type and finish for all items before checkout.",
        variant: "destructive",
      });
      return;
    }
    router.push("/checkout");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100">
            <p className="text-gray-600">Loading cart…</p>
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const allItemsComplete = items.every(
    (item) => item.mediaType && item.finishType
  );

  // IMPORTANT: Shipping is NEVER defaulted to $15.
  // If API returns 0, we show 0.
  const subtotal = cart?.subtotal ?? 0;
  const shipping = cart?.shipping ?? 0;
  const total = cart?.total ?? subtotal + shipping;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="h-8 w-8 text-orange-600" />
          <h1 className="font-heading text-3xl text-gray-900">Your Cart</h1>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-orange-100">
            <Sticker className="h-16 w-16 mx-auto text-orange-300 mb-4" />
            <h3 className="font-heading text-2xl text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Start adding products to see them here.</p>
            <Link href="/products">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const product = item.product;
                if (!product) return null;

                const unit = item.unitPrice ? Number(item.unitPrice) : 0;
                const lineTotal = unit * item.quantity;

                const isItemComplete = item.mediaType && item.finishType;

                return (
                  <div
                    key={item.id}
                    data-testid={`cart-item-${item.id}`}
                    className={`bg-white rounded-2xl p-5 shadow-sm border ${isItemComplete ? 'border-orange-100' : 'border-orange-300'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-orange-50 rounded-xl flex items-center justify-center overflow-hidden border border-orange-100">
                        {item.design?.previewUrl ? (
                          <img
                            src={item.design.previewUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : product.thumbnailUrl ? (
                          <img
                            src={product.thumbnailUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Sticker className="h-8 w-8 text-orange-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{item.design?.name || product.name}</p>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-gray-500">{formatPrice(unit)} each</div>
                            <div className="font-semibold text-gray-900">{formatPrice(lineTotal)}</div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                          <Link href={`/products/${product.slug}`} className="text-sm text-orange-700 hover:underline">
                            View product
                          </Link>

                          <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeItemMutation.mutate(item.id)}
                            disabled={removeItemMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Media Type {!item.mediaType && <span className="text-red-500">*</span>}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {MEDIA_TYPES.map((type) => (
                            <Button
                              key={type}
                              size="sm"
                              variant={item.mediaType === type ? "default" : "outline"}
                              className={item.mediaType === type ? "bg-orange-500 hover:bg-orange-600" : ""}
                              onClick={() => updateItemMutation.mutate({ itemId: item.id, mediaType: type, finishType: item.finishType || undefined })}
                              disabled={updateItemMutation.isPending}
                              data-testid={`select-media-${type.toLowerCase()}-${item.id}`}
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Finish Type {!item.finishType && <span className="text-red-500">*</span>}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {FINISH_TYPES.map((type) => (
                            <Button
                              key={type}
                              size="sm"
                              variant={item.finishType === type ? "default" : "outline"}
                              className={item.finishType === type ? "bg-orange-500 hover:bg-orange-600" : ""}
                              onClick={() => updateItemMutation.mutate({ itemId: item.id, mediaType: item.mediaType || undefined, finishType: type })}
                              disabled={updateItemMutation.isPending}
                              data-testid={`select-finish-${type.toLowerCase()}-${item.id}`}
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 h-fit">
              <h2 className="font-heading text-xl text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">{formatPrice(shipping)}</span>
                </div>

                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-gray-900 font-semibold">Total</span>
                  <span className="text-gray-900 font-semibold">{formatPrice(total)}</span>
                </div>
              </div>

              {!allItemsComplete && items.length > 0 && (
                <p className="text-sm text-orange-600 mt-4">
                  Please select media type and finish for all items to checkout.
                </p>
              )}

              <Button
                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
                onClick={handleCheckout}
                disabled={!allItemsComplete && items.length > 0}
                data-testid="button-checkout"
              >
                {isAuthenticated ? "Checkout" : "Login to Checkout"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
