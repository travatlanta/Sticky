import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, ArrowRight, Sticker, CreditCard, FileImage, Image, Package } from "lucide-react";

export default function ProductDetail() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [quantity, setQuantity] = useState(100);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: [`/api/products/${slug}`],
    enabled: !!slug,
  });

  const calculatePriceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${product?.id}/calculate-price`, {
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
        const defaultOption = product.options.find(
          (o: any) => o.optionType === type && o.isDefault
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
      // Calculate price even if no options (uses basePrice)
      calculatePriceMutation.mutate();
    }
  }, [product?.id, quantity, selectedOptions]);

  const handleStartDesign = async () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }

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
      navigate(`/editor/${design.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start design. Please try again.",
        variant: "destructive",
      });
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

  const groupedOptions: Record<string, any[]> = {};
  product.options?.forEach((option: any) => {
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
              ) : (
                product.name.includes("Sticker") ? <Sticker className="h-32 w-32 text-orange-500" /> : 
                product.name.includes("Card") ? <CreditCard className="h-32 w-32 text-blue-500" /> :
                product.name.includes("Flyer") ? <FileImage className="h-32 w-32 text-green-500" /> :
                product.name.includes("Poster") ? <Image className="h-32 w-32 text-purple-500" /> : 
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
                    {options.map((option: any) => (
                      <button
                        key={option.id}
                        onClick={() =>
                          setSelectedOptions({ ...selectedOptions, [type]: option.id })
                        }
                        className={`p-3 rounded-lg border-2 text-left transition-colors ${
                          selectedOptions[type] === option.id
                            ? "border-primary-500 bg-primary-50"
                            : "border-gray-200 hover:border-gray-300"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(product.minQuantity || 1, quantity - 50))}
                    className="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center hover:border-gray-300"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(product.minQuantity || 1, parseInt(e.target.value) || 0))}
                    className="w-24 text-center text-lg font-medium border-2 border-gray-200 rounded-lg py-2"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 50)}
                    className="w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center hover:border-gray-300"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-gray-100 rounded-xl p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Price per unit</span>
                  <span className="font-medium">
                    {calculatedPrice ? formatPrice(calculatedPrice.pricePerUnit) : "..."}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <span className="text-gray-600">Quantity</span>
                  <span className="font-medium">{quantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary-500">
                    {calculatedPrice ? formatPrice(calculatedPrice.subtotal) : "..."}
                  </span>
                </div>
              </div>

              <div className="pb-6">
                <Button onClick={handleStartDesign} size="lg" className="w-full text-lg">
                  Start Designing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
