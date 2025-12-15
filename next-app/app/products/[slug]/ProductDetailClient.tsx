"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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

interface ProductOption {
  id: number;
  optionType: string;
  name: string;
  isDefault?: boolean;
  priceModifier?: string;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  basePrice?: string;
  options?: ProductOption[];
  minQuantity?: number;
}

export default function ProductDetail() {
  const params = useParams();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, quantity, selectedOptions]);

  const handleStartDesign = async () => {
    if (!isAuthenticated) {
      // Redirect unauthenticated users to the login page rather than a non-existent API route
      router.push("/login");
      return;
    }

    if (!product) return;

    try {
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

      if (!res.ok) throw new Error("Failed to create design");
      const design = await res.json();
      router.push(`/editor/${design.id}`);
    } catch (error) {
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
    // Do not block free products if price is zero; only block if undefined/null
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
        body: JSON.stringify({
          productId: product.id,
          name: `${product.name} Design`,
          selectedOptions,
          highResExportUrl: uploadData.url,
          previewUrl: uploadData.url,
        }),
        credentials: "include",
      });
      if (!designRes.ok) throw new Error("Failed to create design");
      const design = await designRes.json();
      const addRes = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designId: design.id,
          quantity,
          selectedOptions,
        }),
        credentials: "include",
      });
      if (!addRes.ok) throw new Error("Failed to add to cart");
      toast({ title: "Added to Cart", description: "Item added to cart successfully" });
      router.push("/cart");
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsQuickOrderLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Product details header */}
      <div className="bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-100">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              {product?.thumbnailUrl ? (
                <img
                  src={product.thumbnailUrl}
                  alt={product.name}
                  className="w-full h-auto rounded-xl border"
                />
              ) : (
                <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Image className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>
            <div>
              <h1 className="font-heading text-4xl md:text-5xl text-gray-900 mb-2">
                {product?.name || "Product"}
              </h1>
              {product?.description && (
                <p className="text-gray-600 mb-4 whitespace-pre-line">{product.description}</p>
              )}
              {product && calculatedPrice && (
                <p className="text-3xl font-bold text-orange-500 mb-2">
                  {formatPrice(calculatedPrice.total)}
                </p>
              )}
              {/* Quantity selector */}
              <div className="flex items-center gap-3 mb-4">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setQuantity((prev) => Math.max((product?.minQuantity || 1), prev - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setQuantity(
                      isNaN(val) ? (product?.minQuantity || 1) : Math.max(val, product?.minQuantity || 1)
                    );
                  }}
                  className="w-24 px-3 py-2 border rounded-md text-center"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setQuantity((prev) => prev + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {/* Options selector */}
              {product?.options && product.options.length > 0 && (
                <div className="space-y-4 mb-4">
                  {product.options.map((option) => (
                    <div key={option.id} className="flex items-center gap-3">
                      <label className="font-medium capitalize">
                        {option.optionType}: {option.name}
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant={selectedOptions[option.optionType] === option.id ? "default" : "outline"}
                        onClick={() => {
                          setSelectedOptions({ ...selectedOptions, [option.optionType]: option.id });
                        }}
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {/* Start design or quick order */}
              <div className="space-y-4">
                <Button
                  onClick={handleStartDesign}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <Paintbrush className="mr-2 h-5 w-5" />
                  Start Design
                </Button>
                <div className="w-full">
                  <input
                    id="quick-order-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.svg,.ai,.psd,.eps"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {uploadedFile ? (
                    <div className="flex flex-col gap-2">
                      {uploadedPreview && (
                        <img
                          src={uploadedPreview}
                          alt="Upload Preview"
                          className="w-full h-48 object-contain rounded-md border"
                        />
                      )}
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-700 flex-1 truncate">
                          {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(1)} MB)
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUploadedFile(null);
                            setUploadedPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          Change
                        </Button>
                      </div>
                      <Button
                        onClick={handleQuickOrder}
                        size="lg"
                        className="w-full"
                        disabled={
                          isQuickOrderLoading ||
                          calculatedPrice?.pricePerUnit === undefined ||
                          calculatedPrice?.pricePerUnit === null
                        }
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
                            Add to Cart
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <label htmlFor="quick-order-upload" className="flex flex-col items-center justify-center py-6 cursor-pointer">
                      <Upload className="h-10 w-10 text-gray-400 mb-2" />
                      <span className="font-medium text-gray-700">Upload Print-Ready File</span>
                      <span className="text-sm text-gray-500 mt-1">PNG, JPG, PDF, SVG, AI, PSD, EPS</span>
                      <span className="text-xs text-gray-400 mt-1">Max 50MB</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}