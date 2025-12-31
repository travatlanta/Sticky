"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Minus,
  Plus,
  ArrowRight,
  Sticker,
  CreditCard,
  FileImage,
  Image,
  Package,
  Upload,
  ShoppingCart,
  Paintbrush,
  Loader2,
} from "lucide-react";
import { getCartSessionId, setCartSessionId } from "@/lib/cartSession";

interface ProductOption {
  id: number;
  optionType: string;
  name: string;
  isDefault?: boolean;
  priceModifier?: string;
}

interface PricingTier {
  id: number;
  productId: number;
  minQuantity: number;
  maxQuantity?: number | null;
  pricePerUnit: string;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  basePrice?: string;
  options?: ProductOption[];
  minQuantity?: number;
  pricingTiers?: PricingTier[];
  isDealProduct?: boolean;
  fixedQuantity?: number | null;
  fixedPrice?: string | null;
  dealId?: number | null;
  sourceProductId?: number | null;
}

export default function ProductDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";
  const { toast } = useToast();

  const [quantity, setQuantity] = useState(100);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [isQuickOrderLoading, setIsQuickOrderLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${slug}`],
    queryFn: async () => {
      const res = await fetch(`/api/products/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    },
    enabled: !!slug,
  });

  // Detect deal products from database (isDealProduct flag) 
  const isDeal = product?.isDealProduct ?? false;
  const dealId = product?.dealId ?? null;
  const fixedDealQuantity = product?.fixedQuantity ?? null;
  const fixedDealPrice = product?.fixedPrice ? parseFloat(product.fixedPrice) : null;

  // Set initial quantity from deal product if applicable
  useEffect(() => {
    if (isDeal && fixedDealQuantity) {
      setQuantity(fixedDealQuantity);
    }
  }, [isDeal, fixedDealQuantity]);

  const calculatePriceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${slug}/calculate-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, selectedOptions }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to calculate price");
      return res.json();
    },
    onSuccess: (data) => {
      setCalculatedPrice(data);
    },
  });

  useEffect(() => {
    if (product?.options) {
      const defaults: Record<string, number> = {};
      const optionTypes = ["size", "material", "coating"];
      optionTypes.forEach((type) => {
        const defaultOption = product.options?.find(
          (o) => o.optionType === type && o.isDefault
        );
        if (defaultOption) {
          defaults[type] = defaultOption.id;
        }
      });
      setSelectedOptions(defaults);
    }
  }, [product]);

  useEffect(() => {
    if (product?.id) {
      calculatePriceMutation.mutate();
    }
  }, [product?.id, quantity, selectedOptions]);

  const handleStartDesign = async () => {
    console.log('handleStartDesign called, product:', product?.id);
    if (!product) {
      console.log('No product, returning');
      return;
    }

    try {
      console.log('Creating design for product:', product.id);
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          name: `${product.name} Design`,
          selectedOptions,
        }),
        credentials: "include",
      });

      console.log('Design response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Design creation failed:', errorText);
        throw new Error("Failed to create design");
      }
      const design = await res.json();
      console.log('Design created:', design.id, 'navigating to editor');
      // Pass deal parameters to editor if this is a deal
      const editorParams = new URLSearchParams({ qty: String(quantity) });
      if (isDeal && dealId && fixedDealPrice) {
        editorParams.set('dealId', String(dealId));
        editorParams.set('price', String(fixedDealPrice));
      }
      router.push(`/editor/${design.id}?${editorParams.toString()}`);
    } catch (error) {
      console.error('Error in handleStartDesign:', error);
      toast({
        title: "Error",
        description: "Failed to start design. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedPreview(null);
    }
  };

  const handleQuickOrder = async () => {
    if (!isAuthenticated) {
      // Redirect unauthenticated users to the login page
      router.push("/login");
      return;
    }

    if (!product || !uploadedFile) {
      toast({
        title: "Please upload a file",
        description: "Select your design file to continue with quick order.",
        variant: "destructive",
      });
      return;
    }

    if (calculatedPrice?.pricePerUnit === undefined || calculatedPrice?.pricePerUnit === null) {
      toast({
        title: "Calculating price...",
        description: "Please wait a moment for price calculation to complete.",
        variant: "destructive",
      });
      return;
    }

    setIsQuickOrderLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const uploadRes = await fetch("/api/upload/artwork", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();

      const designRes = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // When creating a design via quick order, supply both the high-res export
        // URL and a preview URL. Without a preview, the cart and checkout pages
        // fall back to a placeholder icon. Use the uploaded artwork as both
        // the high-res and preview images. This allows the cart to display a
        // thumbnail without any additional processing.
        body: JSON.stringify({
          productId: product.id,
          name: `${product.name} - Quick Order`,
          selectedOptions,
          highResExportUrl: uploadData.url,
          previewUrl: uploadData.url,
        }),
        credentials: "include",
      });

      if (!designRes.ok) throw new Error("Failed to create design");
      const design = await designRes.json();

      // Include option costs in unit price for accurate cart total
      const fullUnitPrice = parseFloat(calculatedPrice.pricePerUnit) + (parseFloat(calculatedPrice.optionsCost) || 0);
      
      const cartSessionId = getCartSessionId();
      const cartRes = await fetch("/api/cart/add", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Cart-Session-Id": cartSessionId,
        },
        body: JSON.stringify({
          productId: product.id,
          designId: design.id,
          quantity,
          selectedOptions,
          unitPrice: fullUnitPrice,
        }),
        credentials: "include",
      });

      if (!cartRes.ok) throw new Error("Failed to add to cart");
      
      const cartData = await cartRes.json();
      if (cartData.sessionId) {
        setCartSessionId(cartData.sessionId);
      }

      toast({ title: "Added to cart!" });
      router.push("/cart");
    } catch (error) {
      console.error("Quick order error:", error);
      toast({
        title: "Error",
        description: "Failed to process order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsQuickOrderLoading(false);
    }
  };

  const handleAddToCartWithoutDesign = async () => {
    if (!product) return;

    if (calculatedPrice?.pricePerUnit === undefined || calculatedPrice?.pricePerUnit === null) {
      toast({
        title: "Calculating price...",
        description: "Please wait a moment for price calculation to complete.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingToCart(true);

    try {
      const fullUnitPrice = parseFloat(calculatedPrice.pricePerUnit) + (parseFloat(calculatedPrice.optionsCost) || 0);
      
      const cartSessionId = getCartSessionId();
      const cartRes = await fetch("/api/cart/add", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Cart-Session-Id": cartSessionId,
        },
        body: JSON.stringify({
          productId: product.id,
          designId: null,
          quantity,
          selectedOptions,
          unitPrice: fullUnitPrice,
        }),
        credentials: "include",
      });

      if (!cartRes.ok) throw new Error("Failed to add to cart");
      
      const cartData = await cartRes.json();
      if (cartData.sessionId) {
        setCartSessionId(cartData.sessionId);
      }

      toast({ 
        title: "Added to cart!", 
        description: "You can upload your artwork from the cart page."
      });
      router.push("/cart");
    } catch (error) {
      console.error("Add to cart error:", error);
      toast({
        title: "Error",
        description: "Failed to add to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setUploadedPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
      </div>
    );
  }

  // Only show size options on product page - material/coating are selected on cart page
  const groupedOptions: Record<string, ProductOption[]> = {};
  product.options?.forEach((option) => {
    // Filter out material and coating - these are selected on the cart page
    if (option.optionType === 'material' || option.optionType === 'coating') {
      return;
    }
    if (!groupedOptions[option.optionType]) {
      groupedOptions[option.optionType] = [];
    }
    groupedOptions[option.optionType].push(option);
  });

  return (
    <div className="container mx-auto px-4 py-8 pb-16 md:pb-20">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <div className="bg-white rounded-2xl aspect-square flex items-center justify-center shadow-sm">
            {product.thumbnailUrl ? (
              <img
                src={product.thumbnailUrl}
                alt={product.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : product.name.includes("Sticker") ? (
              <Sticker className="h-32 w-32 text-orange-500" />
            ) : product.name.includes("Card") ? (
              <CreditCard className="h-32 w-32 text-blue-500" />
            ) : product.name.includes("Flyer") ? (
              <FileImage className="h-32 w-32 text-green-500" />
            ) : product.name.includes("Poster") ? (
              <Image className="h-32 w-32 text-purple-500" />
            ) : (
              <Package className="h-32 w-32 text-gray-400" />
            )}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="space-y-6">
            {Object.entries(groupedOptions).map(([type, options]) => (
              <div key={type}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {type}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() =>
                        setSelectedOptions({ ...selectedOptions, [type]: option.id })
                      }
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        selectedOptions[type] === option.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">{option.name}</span>
                      {option.priceModifier && parseFloat(option.priceModifier) > 0 && (
                        <span className="text-gray-500 text-sm ml-1">
                          (+{formatPrice(option.priceModifier)})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Bulk Pricing Tiers - Clickable to set quantity (hidden for deals) */}
            {!isDeal && product.pricingTiers && product.pricingTiers.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Bulk Pricing Discounts
                </h3>
                <div className="grid gap-2">
                  {product.pricingTiers.slice(0, 3).map((tier, idx) => (
                    <button 
                      key={tier.id}
                      type="button"
                      onClick={() => setQuantity(tier.minQuantity)}
                      className={`flex justify-between items-center text-sm p-3 rounded-lg cursor-pointer transition-all ${
                        quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity)
                          ? 'bg-green-200 border-2 border-green-400 shadow-sm'
                          : 'bg-white/70 border border-green-100 hover:bg-green-100 hover:border-green-200'
                      }`}
                      data-testid={`button-pricing-tier-${idx}`}
                    >
                      <span className="text-gray-700 font-medium">
                        {tier.minQuantity.toLocaleString()}
                        {tier.maxQuantity ? ` - ${tier.maxQuantity.toLocaleString()}` : '+'} units
                      </span>
                      <span className="font-semibold text-green-700">
                        {formatPrice(tier.pricePerUnit)} each
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-green-600 mt-2">Click a tier to set quantity!</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity {isDeal && <span className="text-orange-600 text-xs ml-1">(Deal - Fixed)</span>}
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(product.minQuantity || 1, quantity - 50))}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center ${
                    isDeal 
                      ? "border-gray-100 text-gray-300 cursor-not-allowed" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  disabled={isDeal}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(product.minQuantity || 1, parseInt(e.target.value) || 0))
                  }
                  className={`w-24 text-center text-lg font-medium border-2 rounded-lg py-2 ${
                    isDeal 
                      ? "border-orange-200 bg-orange-50 text-orange-700" 
                      : "border-gray-200"
                  }`}
                  disabled={isDeal}
                  readOnly={isDeal}
                />
                <button
                  onClick={() => setQuantity(quantity + 50)}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center ${
                    isDeal 
                      ? "border-gray-100 text-gray-300 cursor-not-allowed" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  disabled={isDeal}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {isDeal && (
                <p className="text-xs text-orange-600 mt-1">This is a special deal with a fixed quantity.</p>
              )}
            </div>

            <div className={`rounded-xl p-6 ${isDeal ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200' : 'bg-gray-100'}`}>
              {isDeal && (
                <div className="bg-orange-500 text-white text-center py-1 px-3 rounded-full text-xs font-bold mb-4 inline-block">
                  SPECIAL DEAL
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Price per unit</span>
                <span className="font-medium">
                  {isDeal && fixedDealPrice 
                    ? formatPrice(fixedDealPrice / quantity) 
                    : (calculatedPrice ? formatPrice(calculatedPrice.pricePerUnit) : "...")}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Quantity</span>
                <span className={`font-medium ${isDeal ? 'text-orange-700' : ''}`}>{quantity}</span>
              </div>
              
              {!isDeal && calculatedPrice?.addOns && calculatedPrice.addOns.length > 0 && (
                <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                  {calculatedPrice.addOns.map((addOn: { type: string; name: string; pricePerUnit: number; totalCost: number }, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 capitalize">
                        {addOn.type}: {addOn.name}
                        <span className="text-gray-400 ml-1">(+{formatPrice(addOn.pricePerUnit)}/ea)</span>
                      </span>
                      <span className="font-medium text-gray-700">
                        +{formatPrice(addOn.totalCost)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <span className="text-xl font-bold">Total</span>
                <span className={`text-2xl font-bold ${isDeal ? 'text-orange-600' : 'text-primary-500'}`}>
                  {isDeal && fixedDealPrice 
                    ? formatPrice(fixedDealPrice) 
                    : (calculatedPrice ? formatPrice(calculatedPrice.subtotal) : "...")}
                </span>
              </div>
            </div>

            <div className="pb-6 space-y-4">
              <div className="flex flex-col gap-3">
                <Button onClick={handleStartDesign} size="lg" className="w-full text-lg" data-testid="button-start-design">
                  <Paintbrush className="mr-2 h-5 w-5" />
                  Design Online
                </Button>
                
                <Button 
                  onClick={handleAddToCartWithoutDesign}
                  size="lg" 
                  variant="outline"
                  className="w-full text-lg"
                  disabled={isAddingToCart || calculatedPrice?.pricePerUnit === undefined}
                  data-testid="button-add-to-cart"
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white dark:bg-background px-4 text-gray-500">or upload your artwork now</span>
                  </div>
                </div>

                {!showUploadSection ? (
                  <Button 
                    onClick={() => setShowUploadSection(true)} 
                    size="lg" 
                    variant="ghost"
                    className="w-full"
                    data-testid="button-show-upload"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Artwork Now
                  </Button>
                ) : (
                  <div className="bg-gray-50 dark:bg-muted rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-border">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.svg,.ai,.psd,.eps"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="quick-order-upload"
                      data-testid="input-quick-order-file"
                    />

                    {uploadedFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {uploadedPreview ? (
                            <img
                              src={uploadedPreview}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <FileImage className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{uploadedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearUploadedFile}
                            data-testid="button-clear-upload"
                          >
                            Change
                          </Button>
                        </div>
                        <Button
                          onClick={handleQuickOrder}
                          size="lg"
                          className="w-full"
                          disabled={isQuickOrderLoading || calculatedPrice?.pricePerUnit === undefined || calculatedPrice?.pricePerUnit === null}
                          data-testid="button-quick-order"
                        >
                          {isQuickOrderLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="mr-2 h-5 w-5" />
                              Add to Cart with Artwork
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <label
                        htmlFor="quick-order-upload"
                        className="flex flex-col items-center justify-center py-6 cursor-pointer"
                      >
                        <Upload className="h-10 w-10 text-gray-400 mb-2" />
                        <span className="font-medium text-foreground">Upload Print-Ready File</span>
                        <span className="text-sm text-muted-foreground mt-1">PNG, JPG, PDF, SVG, AI, PSD, EPS</span>
                        <span className="text-xs text-muted-foreground mt-1">Max 50MB</span>
                      </label>
                    )}

                    <Button 
                      onClick={() => {
                        setShowUploadSection(false);
                        clearUploadedFile();
                      }} 
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-muted-foreground"
                      data-testid="button-cancel-upload"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}