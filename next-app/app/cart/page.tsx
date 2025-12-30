"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ShoppingBag, ArrowRight, Sticker, Upload, AlertTriangle, Loader2 } from "lucide-react";

type ProductOption = {
  id: number;
  name: string;
  value?: string | null;
  priceModifier?: string | null;
  isDefault?: boolean;
  displayOrder?: number;
};

type CartItem = {
  id: number;
  quantity: number;
  unitPrice: string | null;
  selectedOptions?: any;
  mediaType?: string | null;
  finishType?: string | null;
  materialOptions?: ProductOption[];
  coatingOptions?: ProductOption[];
  product: {
    id: number;
    name: string;
    slug: string;
    thumbnailUrl: string | null;
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
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Force a refetch whenever the cart page is opened.
  // This fixes "items only appear after refresh" when navigating here immediately after add-to-cart.
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    queryClient.refetchQueries({ queryKey: ["/api/cart"] });
  }, [queryClient]);

  const handleUploadArtwork = async (itemId: number, productId: number, file: File) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setUploadingItemId(itemId);

    try {
      // Upload the file
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload/artwork", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();

      // Create a design with the uploaded artwork
      const designRes = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: productId,
          name: "Uploaded Artwork",
          highResExportUrl: uploadData.url,
          previewUrl: uploadData.url,
        }),
        credentials: "include",
      });

      if (!designRes.ok) throw new Error("Failed to create design");
      const design = await designRes.json();

      // Update the cart item with the design
      const updateRes = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId: design.id }),
        credentials: "include",
      });

      if (!updateRes.ok) throw new Error("Failed to update cart item");

      toast({ title: "Artwork uploaded successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload artwork. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingItemId(null);
    }
  };

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
      toast({
        title: "Update failed",
        description: "Could not update the item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const items = cart?.items ?? [];
  
  // Check if any items are missing artwork (no design attached at all)
  const itemsNeedingArtwork = items.filter(item => !item.design);
  const hasItemsNeedingArtwork = itemsNeedingArtwork.length > 0;

  // Check if any items are missing material/coating type selection
  // Only require selection if the product actually has those options available
  const itemsNeedingSelections = items.filter(item => {
    const hasMaterialOptions = item.materialOptions && item.materialOptions.length > 0;
    const hasCoatingOptions = item.coatingOptions && item.coatingOptions.length > 0;
    const needsMaterial = hasMaterialOptions && !item.mediaType;
    const needsCoating = hasCoatingOptions && !item.finishType;
    return needsMaterial || needsCoating;
  });
  const hasItemsNeedingSelections = itemsNeedingSelections.length > 0;

  // Overall: can checkout only if all requirements met
  const canCheckout = !hasItemsNeedingArtwork && !hasItemsNeedingSelections && items.length > 0;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (hasItemsNeedingArtwork) {
      toast({
        title: "Artwork Required",
        description: `Please upload artwork for ${itemsNeedingArtwork.length} item(s) before checkout.`,
        variant: "destructive",
      });
      return;
    }

    if (hasItemsNeedingSelections) {
      toast({
        title: "Selections Required",
        description: `Please select media type and finish for all items before checkout.`,
        variant: "destructive",
      });
      return;
    }
    
    router.push("/checkout");
  };

  // Helper function to calculate item price including modifiers
  const getItemPriceWithModifiers = (item: CartItem) => {
    const basePrice = item.unitPrice ? Number(item.unitPrice) : 0;
    let materialModifier = 0;
    let coatingModifier = 0;
    
    if (item.mediaType && item.materialOptions) {
      const selectedMaterial = item.materialOptions.find(opt => opt.name === item.mediaType);
      if (selectedMaterial?.priceModifier) {
        materialModifier = parseFloat(selectedMaterial.priceModifier) || 0;
      }
    }
    
    if (item.finishType && item.coatingOptions) {
      const selectedCoating = item.coatingOptions.find(opt => opt.name === item.finishType);
      if (selectedCoating?.priceModifier) {
        coatingModifier = parseFloat(selectedCoating.priceModifier) || 0;
      }
    }
    
    return basePrice + materialModifier + coatingModifier;
  };

  // Prefer server-provided totals. If missing, compute safely.
  const computedSubtotal = items.reduce((sum, item) => {
    const priceWithModifiers = getItemPriceWithModifiers(item);
    return sum + priceWithModifiers * (item.quantity || 0);
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

                const lineUnit = getItemPriceWithModifiers(item);
                const lineTotal = lineUnit * item.quantity;

                const needsArtwork = !item.design;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl p-5 shadow-sm border ${
                      needsArtwork ? "border-amber-300" : "border-orange-100"
                    } flex flex-col gap-4`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-orange-50 rounded-xl flex items-center justify-center overflow-hidden border border-orange-100 flex-shrink-0">
                        {item.design?.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.design.previewUrl}
                            alt="Your design"
                            className="w-full h-full object-cover"
                          />
                        ) : product.thumbnailUrl ? (
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

                    {needsArtwork && (
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-800">
                              Artwork Required
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              Please upload your print-ready artwork before checkout.
                            </p>
                            <input
                              type="file"
                              accept="image/*,.pdf,.svg,.ai,.psd,.eps"
                              className="hidden"
                              ref={(el) => { fileInputRefs.current[item.id] = el; }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && product) {
                                  handleUploadArtwork(item.id, product.id, file);
                                }
                              }}
                              data-testid={`input-upload-artwork-${item.id}`}
                            />
                            <Button
                              size="sm"
                              className="mt-3 bg-amber-600 hover:bg-amber-700"
                              onClick={() => fileInputRefs.current[item.id]?.click()}
                              disabled={uploadingItemId === item.id}
                              data-testid={`button-upload-artwork-${item.id}`}
                            >
                              {uploadingItemId === item.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Artwork
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Material & Coating Selection */}
                    {((item.materialOptions && item.materialOptions.length > 0) || 
                      (item.coatingOptions && item.coatingOptions.length > 0)) && (
                      <div className={`rounded-xl p-4 border ${
                        (!item.mediaType || !item.finishType) 
                          ? "bg-amber-50 border-amber-200" 
                          : "bg-gray-50 border-gray-200"
                      }`}>
                        <div className="space-y-4">
                          {/* Material Options */}
                          {item.materialOptions && item.materialOptions.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                {!item.mediaType && (
                                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                                )}
                                <p className="text-sm font-medium text-gray-700">
                                  Material {!item.mediaType && <span className="text-red-500">*</span>}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {item.materialOptions.map((opt) => {
                                  const priceModNum = parseFloat(opt.priceModifier || "0");
                                  const isSelected = item.mediaType === opt.name;
                                  return (
                                    <Button
                                      key={opt.id}
                                      size="sm"
                                      variant={isSelected ? "default" : "outline"}
                                      className={isSelected ? "bg-orange-500 hover:bg-orange-600" : ""}
                                      onClick={() => updateItemMutation.mutate({ 
                                        itemId: item.id, 
                                        mediaType: opt.name, 
                                        finishType: item.finishType || undefined 
                                      })}
                                      disabled={updateItemMutation.isPending}
                                      data-testid={`select-material-${opt.id}-${item.id}`}
                                    >
                                      {opt.name}
                                      {priceModNum > 0 && (
                                        <span className="ml-1 text-xs opacity-75">(+${priceModNum.toFixed(2)})</span>
                                      )}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Spot Gloss Options */}
                          {item.coatingOptions && item.coatingOptions.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                {!item.finishType && (
                                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                                )}
                                <p className="text-sm font-medium text-gray-700">
                                  Spot Gloss {!item.finishType && <span className="text-red-500">*</span>}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {item.coatingOptions.map((opt) => {
                                  const priceModNum = parseFloat(opt.priceModifier || "0");
                                  const isSelected = item.finishType === opt.name;
                                  return (
                                    <Button
                                      key={opt.id}
                                      size="sm"
                                      variant={isSelected ? "default" : "outline"}
                                      className={isSelected ? "bg-orange-500 hover:bg-orange-600" : ""}
                                      onClick={() => updateItemMutation.mutate({ 
                                        itemId: item.id, 
                                        mediaType: item.mediaType || undefined, 
                                        finishType: opt.name 
                                      })}
                                      disabled={updateItemMutation.isPending}
                                      data-testid={`select-coating-${opt.id}-${item.id}`}
                                    >
                                      {opt.name}
                                      {priceModNum > 0 && (
                                        <span className="ml-1 text-xs opacity-75">(+${priceModNum.toFixed(2)})</span>
                                      )}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-500 text-sm">Calculated at checkout</span>
                </div>

                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-gray-900 font-semibold">Estimated Total</span>
                  <span className="text-gray-900 font-semibold">{formatPrice(total)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Final total calculated at checkout</p>
              </div>

              {hasItemsNeedingArtwork && (
                <div className="bg-amber-50 rounded-lg p-3 mb-4 border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-xs font-medium">
                      {itemsNeedingArtwork.length} item(s) need artwork before checkout
                    </p>
                  </div>
                </div>
              )}

              {hasItemsNeedingSelections && !hasItemsNeedingArtwork && (
                <div className="bg-amber-50 rounded-lg p-3 mb-4 border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-xs font-medium">
                      {itemsNeedingSelections.length} item(s) need material & finish selection
                    </p>
                  </div>
                </div>
              )}

              <Button
                className={`w-full ${
                  !canCheckout 
                    ? "bg-gray-400 hover:bg-gray-500" 
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                }`}
                onClick={handleCheckout}
                disabled={!canCheckout && isAuthenticated}
                data-testid="button-checkout"
              >
                {!isAuthenticated 
                  ? "Login to Checkout" 
                  : hasItemsNeedingArtwork 
                    ? "Upload Artwork to Continue"
                    : hasItemsNeedingSelections
                      ? "Complete Selections to Continue"
                      : "Checkout"
                }
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
