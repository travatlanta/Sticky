"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, ShoppingCart, Check, Loader2, 
  ChevronDown, Minus, Plus, ArrowLeft
} from "lucide-react";

interface ProductOption {
  id: number;
  optionType: string;
  name: string;
  value?: string;
  priceModifier?: string;
  isDefault?: boolean;
}

interface PricingTier {
  id: number;
  minQuantity: number;
  maxQuantity?: number;
  pricePerUnit: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  basePrice?: string;
  options?: ProductOption[];
  pricingTiers?: PricingTier[];
  minQuantity?: number;
  printWidthInches?: string;
  printHeightInches?: string;
  printDpi?: number;
  supportsCustomShape?: boolean;
}

interface Design {
  id: number;
  name?: string;
  productId?: number;
  previewUrl?: string;
  highResExportUrl?: string;
  customShapeUrl?: string;
  selectedOptions?: Record<string, any>;
  canvasJson?: any;
}

interface PriceCalculation {
  pricePerUnit: number;
  optionsCost: number;
  baseSubtotal: number;
  subtotal: number;
  addOns?: Array<{ type: string; name: string; pricePerUnit: number; totalCost: number }>;
}

// Default quantity quick-select options
const DEFAULT_QUANTITY_OPTIONS = [25, 50, 100, 250, 500, 1000];

export default function Editor() {
  const params = useParams();
  const designId = params.designId as string;
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [imageSize, setImageSize] = useState({ width: 2, height: 2 });
  const [quantity, setQuantity] = useState(50);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<PriceCalculation | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  // Fetch design data
  const { data: design, isLoading: designLoading, error: designError } = useQuery<Design>({
    queryKey: [`/api/designs/${designId}`],
    queryFn: async () => {
      const res = await fetch(`/api/designs/${designId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch design");
      return res.json();
    },
    enabled: !!designId,
    retry: false,
  });

  // Fetch product data
  const { data: product, isLoading: productLoading, error: productError } = useQuery<Product>({
    queryKey: [`/api/products/by-id/${design?.productId}`],
    queryFn: async () => {
      const res = await fetch(`/api/products/by-id/${design?.productId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    },
    enabled: !!design?.productId,
    retry: false,
  });

  // Load existing design preview if available
  useEffect(() => {
    if (design?.previewUrl) {
      setUploadedImage(design.previewUrl);
    }
    if (design?.selectedOptions) {
      setSelectedOptions(design.selectedOptions as Record<string, number>);
    }
  }, [design]);

  // Set default options when product loads
  useEffect(() => {
    if (product?.options && Object.keys(selectedOptions).length === 0) {
      const defaults: Record<string, number> = {};
      product.options.forEach((opt) => {
        if (opt.isDefault) {
          defaults[opt.optionType] = opt.id;
        }
      });
      setSelectedOptions(defaults);
    }
  }, [product]);

  // Calculate price when options change (with debounce)
  const priceCalculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const calculatePrice = useCallback(async () => {
    if (!product?.slug) return;
    
    setPriceLoading(true);
    setPriceError(null);
    
    try {
      const res = await fetch(`/api/products/${product.slug}/calculate-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, selectedOptions }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to calculate price");
      const data = await res.json();
      setCalculatedPrice(data);
    } catch (error) {
      setPriceError("Unable to calculate price");
      console.error("Price calculation error:", error);
    } finally {
      setPriceLoading(false);
    }
  }, [product?.slug, quantity, selectedOptions]);

  useEffect(() => {
    // Debounce price calculation to avoid rapid API calls
    if (priceCalculationTimeoutRef.current) {
      clearTimeout(priceCalculationTimeoutRef.current);
    }
    
    priceCalculationTimeoutRef.current = setTimeout(() => {
      if (product?.slug) {
        calculatePrice();
      }
    }, 300); // 300ms debounce
    
    return () => {
      if (priceCalculationTimeoutRef.current) {
        clearTimeout(priceCalculationTimeoutRef.current);
      }
    };
  }, [product?.slug, quantity, selectedOptions, calculatePrice]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileName(file.name);

    try {
      // Create preview and get dimensions
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Calculate size in inches (assume 300 DPI)
          const dpi = product?.printDpi || 300;
          const widthInches = Math.round((img.width / dpi) * 10) / 10;
          const heightInches = Math.round((img.height / dpi) * 10) / 10;
          
          // Clamp to reasonable print sizes (1" to 12")
          setImageSize({
            width: Math.max(1, Math.min(12, widthInches || 2)),
            height: Math.max(1, Math.min(12, heightInches || 2)),
          });
        };
        img.src = event.target?.result as string;
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadRes = await fetch("/api/upload/artwork", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await uploadRes.json();

      // Update design with the uploaded image (use PUT - no auth required)
      const updateRes = await fetch(`/api/designs/${designId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewUrl: url,
          highResExportUrl: url,
        }),
        credentials: "include",
      });

      if (!updateRes.ok) {
        console.error("Failed to update design with artwork URL");
      }

      toast({
        title: "Upload complete",
        description: "Your artwork has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again with a different file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Add to cart
  const handleAddToCart = async () => {
    if (!uploadedImage) {
      toast({
        title: "No artwork uploaded",
        description: "Please upload your design first.",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, persist the selected options and size to the design
      await fetch(`/api/designs/${designId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedOptions,
          canvasJson: {
            width: imageSize.width,
            height: imageSize.height,
            widthInches: imageSize.width,
            heightInches: imageSize.height,
          },
        }),
        credentials: "include",
      });

      // Calculate unit price including option costs
      const unitPrice = calculatedPrice?.pricePerUnit 
        ? (calculatedPrice.pricePerUnit + (calculatedPrice.optionsCost || 0))
        : parseFloat(product?.basePrice || "0");

      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product?.id,
          quantity,
          selectedOptions,
          designId: parseInt(designId),
          unitPrice: unitPrice.toString(),
          // Include artwork and size info for fulfillment
          metadata: {
            artworkUrl: uploadedImage,
            widthInches: imageSize.width,
            heightInches: imageSize.height,
          },
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to add to cart");

      setAddedToCart(true);
      toast({
        title: "Added to cart",
        description: "Your custom stickers have been added to your cart.",
      });
    } catch (error) {
      toast({
        title: "Failed to add to cart",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (designLoading || productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (designError || !design) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <h2 className="text-xl font-semibold mb-4">Design not found</h2>
        <p className="text-gray-500 mb-6">The design you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => router.push("/products")} data-testid="button-browse-products">
          Browse Products
        </Button>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <h2 className="text-xl font-semibold mb-4">Product not found</h2>
        <p className="text-gray-500 mb-6">The product associated with this design is no longer available.</p>
        <Button onClick={() => router.push("/products")} data-testid="button-browse-products">
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg truncate max-w-[200px]" data-testid="text-product-name">
            {product?.name || "Custom Sticker"}
          </h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-57px)]">
        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-900">
          <div 
            className="relative bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden"
            style={{
              width: "min(90vw, 400px)",
              height: "min(50vh, 400px)",
            }}
            data-testid="preview-container"
          >
            {uploadedImage ? (
              <div className="relative animate-float">
                {/* White bleed border effect */}
                <div 
                  className="absolute inset-0 bg-white rounded-lg shadow-xl"
                  style={{
                    transform: "scale(1.08)",
                    filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.2))",
                  }}
                />
                {/* Artwork */}
                <img
                  src={uploadedImage}
                  alt="Your design"
                  className="relative z-10 max-w-full max-h-full object-contain rounded"
                  style={{ maxWidth: "280px", maxHeight: "280px" }}
                  data-testid="preview-image"
                />
              </div>
            ) : (
              <div className="text-center p-8">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">No artwork uploaded</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  data-testid="button-upload-prompt"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Your Design
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="lg:w-96 bg-white dark:bg-gray-800 border-t lg:border-t-0 lg:border-l overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Upload Section */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.svg"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="input-file-upload"
              />
              {uploadedImage && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  data-testid="button-change-artwork"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Change Artwork
                    </>
                  )}
                </Button>
              )}
              {uploadedFileName && (
                <p className="text-sm text-gray-500 mt-2 truncate" data-testid="text-filename">
                  {uploadedFileName}
                </p>
              )}
            </div>

            {/* Material Selection - Use actual product options */}
            {product?.options && product.options.filter(o => o.optionType === "material").length > 0 && (
              <div>
                <h3 className="font-medium mb-3" data-testid="label-material">Material</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.options.filter(o => o.optionType === "material").map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedOptions({ ...selectedOptions, material: option.id })}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedOptions.material === option.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                      data-testid={`button-material-${option.id}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{option.name}</span>
                        {option.priceModifier && parseFloat(option.priceModifier) > 0 && (
                          <span className="text-xs text-gray-500">+${option.priceModifier}/ea</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Coating Selection - Use actual product options */}
            {product?.options && product.options.filter(o => o.optionType === "coating").length > 0 && (
              <div>
                <h3 className="font-medium mb-3" data-testid="label-coating">Finish</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.options.filter(o => o.optionType === "coating").map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedOptions({ ...selectedOptions, coating: option.id })}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedOptions.coating === option.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                      data-testid={`button-coating-${option.id}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{option.name}</span>
                        {option.priceModifier && parseFloat(option.priceModifier) > 0 && (
                          <span className="text-xs text-gray-500">+${option.priceModifier}/ea</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Controls */}
            <div>
              <h3 className="font-medium mb-3" data-testid="label-size">Size (inches)</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm text-gray-500 mb-1 block">Width</label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    step={0.1}
                    value={imageSize.width}
                    onChange={(e) => setImageSize({ ...imageSize, width: parseFloat(e.target.value) || 1 })}
                    data-testid="input-width"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-500 mb-1 block">Height</label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    step={0.1}
                    value={imageSize.height}
                    onChange={(e) => setImageSize({ ...imageSize, height: parseFloat(e.target.value) || 1 })}
                    data-testid="input-height"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Size auto-detected from your uploaded file
              </p>
            </div>

            {/* Quantity Selection */}
            <div>
              <h3 className="font-medium mb-3" data-testid="label-quantity">Quantity</h3>
              <div className="flex items-center gap-3 mb-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(product?.minQuantity || 1, quantity - 25))}
                  data-testid="button-quantity-decrease"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min={product?.minQuantity || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || product?.minQuantity || 1)}
                  className="w-24 text-center"
                  data-testid="input-quantity"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 25)}
                  data-testid="button-quantity-increase"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {/* Quick quantity buttons from pricing tiers or defaults */}
              <div className="flex flex-wrap gap-2">
                {(product?.pricingTiers && product.pricingTiers.length > 0 
                  ? product.pricingTiers.map(t => t.minQuantity)
                  : DEFAULT_QUANTITY_OPTIONS
                ).slice(0, 6).map((qty) => (
                  <button
                    key={qty}
                    onClick={() => setQuantity(qty)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                      quantity === qty
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                    data-testid={`button-qty-${qty}`}
                  >
                    {qty} pcs
                  </button>
                ))}
              </div>
              
              {/* Show price breakdown for current selection */}
              {product?.pricingTiers && product.pricingTiers.length > 0 && (
                <div className="mt-3 text-xs text-gray-500">
                  <p className="mb-1">Volume pricing:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {product.pricingTiers.slice(0, 4).map((tier) => (
                      <span key={tier.id}>
                        {tier.minQuantity}+ @ ${parseFloat(tier.pricePerUnit).toFixed(2)}/ea
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Display */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              {priceError ? (
                <div className="text-center py-2 text-destructive" data-testid="text-price-error">
                  {priceError}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-300">Price per sticker</span>
                    <span className="font-medium" data-testid="text-price-per-unit">
                      {priceLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : calculatedPrice?.pricePerUnit ? (
                        formatPrice(calculatedPrice.pricePerUnit + (calculatedPrice.optionsCost || 0))
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                  {calculatedPrice?.addOns?.map((addon, i) => (
                    <div key={i} className="flex justify-between items-center text-sm text-gray-500">
                      <span>{addon.name}</span>
                      <span>+{formatPrice(addon.totalCost)}</span>
                    </div>
                  ))}
                  <div className="border-t mt-3 pt-3 flex justify-between items-center">
                    <span className="font-semibold text-lg">Total</span>
                    <span className="font-bold text-2xl text-primary" data-testid="text-total-price">
                      {priceLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : calculatedPrice?.subtotal ? (
                        formatPrice(calculatedPrice.subtotal)
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Add to Cart Button */}
            <Button
              className="w-full h-14 text-lg"
              onClick={addedToCart ? () => router.push("/cart") : handleAddToCart}
              disabled={!uploadedImage}
              data-testid="button-add-to-cart"
            >
              {addedToCart ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Go to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Floating animation styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
