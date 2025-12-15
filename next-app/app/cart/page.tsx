"use client";

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
  product: {
    id: number;
    name: string;
    slug: string;
    thumbnailUrl: string | null;
    // shipping fields may exist but UI doesn't need them here
    shippingType?: string | null;
    flatShippingPrice?: string | null;
  } | null;
  design?: {
    id: number;
    name?: string | null;
    previewUrl?: string | null;
  } | null;
};

type CartResponse = {
  items: CartItem[];
  subtotal?: number;
  shipping?: number;
  total?: number;
};

async function fetchCart(): Promise<CartResponse> {
  const res = await fetch("/api/cart", {
    credentials: "include",
    cache: "no-store",
  });

  // Never hard-fail the cart UI if the API has a transient issue
  if (!res.ok) {
    return { items: [], subtotal: 0, shipping: 0, total: 0 };
  }

  const data = (await res.json()) as CartResponse;

  // Ensure shape
  return {
    items: Array.isArray(data.items) ? data.items : [],
    subtotal: typeof data.subtotal === "number" ? data.subtotal : undefined,
    shipping: typeof data.shipping === "number" ? data.shipping : undefined,
    total: typeof data.total === "number" ? data.total : undefined,
  };
}

export default function CartClient() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Force a refetch whenever the cart page is opened.
  // This fixes "items only appear after refresh" when navigating here immediately after add-to-cart.
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    queryClient.refetchQueries({ queryKey: ["/api/cart"] });
  }, [queryClient]);

  const { data: cart, isLoading } = useQuery<CartResponse>({
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
      toast({
        title: "Item removed",
        description: "The item has been removed from your cart.",
      });
    },
    onError: () => {
      toast({
        title: "Remove failed",
        description: "Could not remove the item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    router.push("/checkout");
  };

  const items = cart?.items ?? [];

  // Prefer server-provided totals. If missing, compute safely.
  const computedSubtotal = items.reduce((sum, item) => {
    const price = item.unitPrice ? Number(item.unitPrice) : 0;
    return sum + price * (item.quantity || 0);
  }, 0);

  const subtotal = typeof cart?.subtotal === "number" ? cart.subtotal : computedSubtotal;
  const shipping = typeof cart?.shipping === "number" ? cart.shipping : 0;
  const total = typeof cart?.total === "number" ? cart.total : subtotal + shipping;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="h-8 w-8 text-orange-600" />
          <h1 className="font-heading text-3xl text-gray-900">Your Cart</h1>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100">
            <p className="text-gray-600">Loading cart…</p>
          </div>
        ) : items.length === 0 ? (
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

                const lineUnit = item.unitPrice ? Number(item.unitPrice) : 0;
                const lineTotal = lineUnit * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 flex items-center gap-4"
                  >
                    <div className="w-20 h-20 bg-orange-50 rounded-xl flex items-center justify-center overflow-hidden border border-orange-100">
                      {product.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
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
                          <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>

                        <div className="text-right">
                          {lineUnit > 0 ? (
                            <>
                              <div className="text-sm text-gray-500">
                                {formatPrice(lineUnit)} each
                              </div>
                              <div className="font-semibold text-gray-900">
                                {formatPrice(lineTotal)}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">—</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <Link
                          href={`/products/${product.slug}`}
                          className="text-sm text-orange-700 hover:underline"
                        >
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

              <Button
                className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                onClick={handleCheckout}
              >
                {isAuthenticated ? "Checkout" : "Login to Checkout"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              {!isAuthenticated && (
                <p className="text-xs text-gray-500 mt-3">
                  You can build your cart as a guest, but you’ll need to log in to checkout.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
