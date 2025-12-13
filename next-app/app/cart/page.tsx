"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ShoppingBag, ArrowRight, Sticker, Sparkles } from "lucide-react";

export default function Cart() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery<{ items?: any[] } | null>({
    queryKey: ["/api/cart"],
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
  });

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    toast({
      title: "Coming Soon",
      description: "Checkout functionality will be available soon!",
    });
  };

  const subtotal = cart?.items?.reduce(
    (sum: number, item: any) =>
      sum + parseFloat(item.unitPrice || item.product?.basePrice || 0) * item.quantity,
    0
  ) || 0;
  const shipping = 15;
  const total = subtotal + shipping;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-orange-100 rounded w-1/4" />
            <div className="h-32 bg-orange-50 rounded-2xl" />
            <div className="h-32 bg-orange-50 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="container mx-auto px-4 py-8 pb-16 md:pb-20">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-white border border-orange-200 rounded-full px-4 py-2 mb-4">
            <ShoppingBag className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">Your Cart</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-gray-900">Shopping Cart</h1>
        </div>

        {(cart?.items?.length ?? 0) > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {cart?.items?.map((item: any) => (
                <div key={item.id} className="bg-white rounded-2xl p-6 shadow-md border border-orange-100 flex gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    {item.design?.previewUrl ? (
                      <img
                        src={item.design.previewUrl}
                        alt="Design preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Sticker className="h-10 w-10 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-xl text-gray-900">
                      {item.product?.name || "Product"}
                    </h3>
                    <p className="text-gray-500 text-sm">Quantity: {item.quantity}</p>
                    <p className="text-orange-500 font-bold mt-2 text-lg">
                      {formatPrice(
                        parseFloat(item.unitPrice || item.product?.basePrice || 0) * item.quantity
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                    <button
                      onClick={() => removeItemMutation.mutate(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <Link href={`/editor/${item.designId}`}>
                      <Button variant="outline" size="sm" className="border-orange-200 hover:bg-orange-50">
                        Edit Design
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-orange-100 h-fit">
              <h3 className="font-heading text-xl mb-4 text-gray-900">Order Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">{formatPrice(shipping)}</span>
                </div>
                <div className="border-t border-orange-100 pt-3 flex justify-between">
                  <span className="text-xl font-heading text-gray-900">Total</span>
                  <span className="text-xl font-bold text-orange-500">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
              <Button onClick={handleCheckout} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30" size="lg">
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-orange-100 shadow-md">
            <ShoppingBag className="h-20 w-20 text-orange-300 mx-auto mb-4" />
            <h3 className="font-heading text-2xl text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">
              Start adding products to see them here.
            </p>
            <Link href="/products">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                Browse Products
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
