import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ShoppingBag, ArrowRight, Sticker } from "lucide-react";

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
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
      window.location.href = "/api/login";
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cart?.items?.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {cart.items.map((item: any) => (
                <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm flex gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.design?.previewUrl ? (
                      <img
                        src={item.design.previewUrl}
                        alt="Design preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Sticker className="h-10 w-10 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {item.product?.name || "Product"}
                    </h3>
                    <p className="text-gray-500 text-sm">Quantity: {item.quantity}</p>
                    <p className="text-primary-500 font-semibold mt-2">
                      {formatPrice(
                        parseFloat(item.unitPrice || item.product?.basePrice || 0) * item.quantity
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                    <button
                      onClick={() => removeItemMutation.mutate(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <Link href={`/editor/${item.designId}`}>
                      <Button variant="outline" size="sm">
                        Edit Design
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm h-fit">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">{formatPrice(shipping)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold text-primary-500">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
              <Button onClick={handleCheckout} className="w-full" size="lg">
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">
              Start adding products to see them here.
            </p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
