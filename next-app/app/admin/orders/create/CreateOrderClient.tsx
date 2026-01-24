"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import {
  Plus,
  Minus,
  Trash2,
  Search,
  User,
  Package,
  ShoppingCart,
  Loader2,
  ArrowLeft,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  slug: string;
  basePrice: string;
  thumbnailUrl: string | null;
  options?: ProductOption[];
}

interface ProductOption {
  id: number;
  optionType: string;
  name: string;
  value: string | null;
  priceModifier: string;
  isDefault: boolean;
}

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

interface OrderItem {
  productId: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  selectedOptions: Record<string, string>;
  optionPriceModifiers: number;
}

interface CustomerInfo {
  userId: string | null;
  email: string;
  name: string;
  phone: string;
  isNewCustomer: boolean;
}

interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function CreateOrderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillUserId = searchParams.get("userId");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    userId: null,
    email: "",
    name: "",
    phone: "",
    isNewCustomer: true,
  });

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "USA",
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState("");
  const [shippingCost, setShippingCost] = useState(15);
  const [taxRate, setTaxRate] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: showUserSearch || !!prefillUserId,
  });

  useEffect(() => {
    if (prefillUserId && users.length > 0) {
      const user = users.find((u) => u.id === prefillUserId);
      if (user) {
        selectUser(user);
      }
    }
  }, [prefillUserId, users]);

  const selectUser = (user: User) => {
    setCustomerInfo({
      userId: user.id,
      email: user.email || "",
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      phone: user.phone || "",
      isNewCustomer: false,
    });
    setShippingAddress((prev) => ({
      ...prev,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    }));
    setShowUserSearch(false);
    setUserSearch("");
  };

  const clearUser = () => {
    setCustomerInfo({
      userId: null,
      email: "",
      name: "",
      phone: "",
      isNewCustomer: true,
    });
  };

  const addProduct = (product: Product) => {
    const defaultOptions: Record<string, string> = {};
    let optionModifiers = 0;

    if (product.options) {
      const materialOpt = product.options.find((o) => o.optionType === "material" && o.isDefault);
      const coatingOpt = product.options.find((o) => o.optionType === "coating" && o.isDefault);
      const cutOpt = product.options.find((o) => o.optionType === "cut" && o.isDefault);

      if (materialOpt) {
        defaultOptions.material = materialOpt.name;
        optionModifiers += parseFloat(materialOpt.priceModifier || "0");
      }
      if (coatingOpt) {
        defaultOptions.spotGloss = coatingOpt.name;
        optionModifiers += parseFloat(coatingOpt.priceModifier || "0");
      }
      if (cutOpt) {
        defaultOptions.cutType = cutOpt.name;
        optionModifiers += parseFloat(cutOpt.priceModifier || "0");
      }
    }

    const existingIndex = orderItems.findIndex((item) => item.productId === product.id);

    if (existingIndex >= 0) {
      const newItems = [...orderItems];
      newItems[existingIndex].quantity += 1;
      setOrderItems(newItems);
    } else {
      setOrderItems([
        ...orderItems,
        {
          productId: product.id,
          product,
          quantity: 1,
          unitPrice: parseFloat(product.basePrice),
          selectedOptions: defaultOptions,
          optionPriceModifiers: optionModifiers,
        },
      ]);
    }

    setShowProductSearch(false);
    setProductSearch("");
  };

  const updateItemQuantity = (index: number, delta: number) => {
    const newItems = [...orderItems];
    newItems[index].quantity = Math.max(1, newItems[index].quantity + delta);
    setOrderItems(newItems);
  };

  const updateItemPrice = (index: number, price: number) => {
    const newItems = [...orderItems];
    newItems[index].unitPrice = price;
    setOrderItems(newItems);
  };

  const updateItemOption = (index: number, optionType: string, value: string, modifier: number) => {
    const newItems = [...orderItems];
    newItems[index].selectedOptions[optionType] = value;

    let totalModifiers = 0;
    const product = newItems[index].product;
    if (product.options) {
      for (const [type, name] of Object.entries(newItems[index].selectedOptions)) {
        const opt = product.options.find(
          (o) =>
            (o.optionType === type || (o.optionType === "coating" && type === "spotGloss") || (o.optionType === "cut" && type === "cutType")) &&
            o.name === name
        );
        if (opt) {
          totalModifiers += parseFloat(opt.priceModifier || "0");
        }
      }
    }
    newItems[index].optionPriceModifiers = totalModifiers;

    setOrderItems(newItems);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const subtotal = orderItems.reduce((sum, item) => {
    return sum + (item.unitPrice + item.optionPriceModifiers) * item.quantity;
  }, 0);

  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(orderData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to create order");
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order created successfully",
        description: `Order ${data.orderNumber} has been created. The customer will receive an email with payment link.`,
      });
      router.push("/admin/orders");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!customerInfo.email) {
      toast({ title: "Customer email is required", variant: "destructive" });
      return;
    }
    if (!customerInfo.name) {
      toast({ title: "Customer name is required", variant: "destructive" });
      return;
    }
    if (orderItems.length === 0) {
      toast({ title: "Please add at least one product", variant: "destructive" });
      return;
    }

    createOrderMutation.mutate({
      customer: customerInfo,
      shippingAddress,
      items: orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice + item.optionPriceModifiers,
        selectedOptions: item.selectedOptions,
      })),
      subtotal,
      shippingCost,
      taxAmount,
      discountAmount,
      totalAmount,
      notes,
    });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Manual Order</h1>
            <p className="text-gray-600 text-sm">
              Create an order for a customer (phone/in-person)
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
                {customerInfo.userId ? (
                  <Button variant="ghost" size="sm" onClick={clearUser}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUserSearch(true)}
                    data-testid="button-search-user"
                  >
                    <Search className="h-4 w-4 mr-1" />
                    Find Existing User
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {customerInfo.userId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                    Linked to existing user account
                  </div>
                )}
                {!customerInfo.userId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <UserPlus className="h-4 w-4 inline mr-1" />
                    New customer - they will receive an email to create an account and pay
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={customerInfo.name}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, name: e.target.value })
                      }
                      placeholder="John Doe"
                      data-testid="input-customer-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, email: e.target.value })
                      }
                      placeholder="customer@example.com"
                      data-testid="input-customer-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input
                      id="customerPhone"
                      value={customerInfo.phone}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, phone: e.target.value })
                      }
                      placeholder="(555) 123-4567"
                      data-testid="input-customer-phone"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProductSearch(true)}
                  data-testid="button-add-product"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Product
                </Button>
              </CardHeader>
              <CardContent>
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No products added yet</p>
                    <Button
                      variant="link"
                      onClick={() => setShowProductSearch(true)}
                      className="mt-2"
                    >
                      Add your first product
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`order-item-${item.productId}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3">
                            {item.product.thumbnailUrl && (
                              <img
                                src={item.product.thumbnailUrl}
                                alt={item.product.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div>
                              <h4 className="font-medium">{item.product.name}</h4>
                              <div className="text-sm text-gray-600 mt-1">
                                {Object.entries(item.selectedOptions).map(([key, val]) => (
                                  <span key={key} className="mr-2">
                                    {key}: {val}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">Quantity</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateItemQuantity(index, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateItemQuantity(index, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Unit Price ($)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItemPrice(index, parseFloat(e.target.value) || 0)
                              }
                              className="mt-1 h-8"
                            />
                          </div>
                          <div className="flex items-end">
                            <div className="text-right w-full">
                              <Label className="text-xs">Line Total</Label>
                              <div className="font-semibold mt-1">
                                {formatPrice(
                                  (item.unitPrice + item.optionPriceModifiers) * item.quantity
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {item.product.options && item.product.options.length > 0 && (
                          <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t">
                            {["material", "coating", "cut"].map((optType) => {
                              const options = item.product.options?.filter(
                                (o) => o.optionType === optType
                              );
                              if (!options || options.length === 0) return null;
                              const optionKey =
                                optType === "coating"
                                  ? "spotGloss"
                                  : optType === "cut"
                                  ? "cutType"
                                  : optType;
                              return (
                                <div key={optType}>
                                  <Label className="text-xs capitalize">{optType}</Label>
                                  <Select
                                    value={item.selectedOptions[optionKey] || ""}
                                    onValueChange={(val) => {
                                      const opt = options.find((o) => o.name === val);
                                      updateItemOption(
                                        index,
                                        optionKey,
                                        val,
                                        parseFloat(opt?.priceModifier || "0")
                                      );
                                    }}
                                  >
                                    <SelectTrigger className="mt-1 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {options.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.name}>
                                          {opt.name}{" "}
                                          {parseFloat(opt.priceModifier) > 0 &&
                                            `(+$${opt.priceModifier})`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="shippingName">Recipient Name</Label>
                    <Input
                      id="shippingName"
                      value={shippingAddress.name}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, name: e.target.value })
                      }
                      placeholder="John Doe"
                      data-testid="input-shipping-name"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="shippingStreet">Street Address</Label>
                    <Input
                      id="shippingStreet"
                      value={shippingAddress.street}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, street: e.target.value })
                      }
                      placeholder="123 Main St"
                      data-testid="input-shipping-street"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingCity">City</Label>
                    <Input
                      id="shippingCity"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                      placeholder="Phoenix"
                      data-testid="input-shipping-city"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="shippingState">State</Label>
                      <Input
                        id="shippingState"
                        value={shippingAddress.state}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, state: e.target.value })
                        }
                        placeholder="AZ"
                        data-testid="input-shipping-state"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shippingZip">ZIP</Label>
                      <Input
                        id="shippingZip"
                        value={shippingAddress.zipCode}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, zipCode: e.target.value })
                        }
                        placeholder="85001"
                        data-testid="input-shipping-zip"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes about this order..."
                  rows={3}
                  data-testid="input-order-notes"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Shipping</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                      className="w-24 h-8 text-right"
                      data-testid="input-shipping-cost"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tax (%)</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-24 h-8 text-right"
                      data-testid="input-tax-rate"
                    />
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Tax Amount</span>
                      <span>{formatPrice(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span>Discount</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="w-24 h-8 text-right"
                      data-testid="input-discount"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={
                    createOrderMutation.isPending ||
                    orderItems.length === 0 ||
                    !customerInfo.email ||
                    !customerInfo.name
                  }
                  data-testid="button-create-order"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    "Create Order & Send Payment Link"
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Customer will receive an email with a link to pay for this order
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showProductSearch} onOpenChange={setShowProductSearch}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-10"
              data-testid="input-search-product"
            />
          </div>
          <div className="overflow-y-auto flex-1 space-y-2 mt-4">
            {productsLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No products found</p>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addProduct(product)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors text-left"
                  data-testid={`button-select-product-${product.id}`}
                >
                  {product.thumbnailUrl ? (
                    <img
                      src={product.thumbnailUrl}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-gray-600">
                      Base price: {formatPrice(parseFloat(product.basePrice))}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Find Existing Customer</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-10"
              data-testid="input-search-user"
            />
          </div>
          <div className="overflow-y-auto flex-1 space-y-2 mt-4">
            {usersLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No users found</p>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors text-left"
                  data-testid={`button-select-user-${user.id}`}
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {user.firstName} {user.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
