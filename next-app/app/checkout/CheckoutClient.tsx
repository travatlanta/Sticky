/*
 * Sticky Banditos Checkout Page
 *
 * This file defines the client-side checkout experience. It has been updated
 * to improve spacing around the page, gracefully handle missing Square
 * environment variables, and ensure the payment form only renders when
 * properly configured. If Square credentials are missing, a friendly
 * message is shown instead of throwing a client-side exception. The page
 * also includes ample vertical padding so the content doesn’t feel
 * cramped against the header or footer.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PaymentForm, CreditCard } from 'react-square-web-payments-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart, CreditCard as CreditCardIcon, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface CartItem {
  id: number;
  quantity: number;
  unitPrice: string;
  product: {
    id: number;
    name: string;
    thumbnailUrl: string | null;
  };
  design?: {
    id: number;
    name: string;
    previewUrl: string | null;
  } | null;
  selectedOptions: Record<string, string> | null;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export default function CheckoutClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  });

  // Retrieve cart details. The query key matches the API route used for the cart.
  const { data: cart, isLoading: cartLoading } = useQuery<{
    items: CartItem[];
    subtotal: number;
    total: number;
  }>({
    queryKey: ['/api/cart'],
  });

  // Mutation to create a payment on the server. It posts to the create-payment API.
  const paymentMutation = useMutation({
    mutationFn: async (paymentData: { sourceId: string; shippingAddress: ShippingAddress }) => {
      const response = await fetch('/api/checkout/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Payment Successful!',
        description: 'Your order has been placed.',
      });
      router.push(`/orders/${data.orderId}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Payment Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle submission of the shipping form. Validates required fields then moves to payment step.
  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !shippingAddress.firstName ||
      !shippingAddress.lastName ||
      !shippingAddress.address1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zip
    ) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required shipping fields.',
        variant: 'destructive',
      });
      return;
    }
    setStep('payment');
  };

  // Handle card tokenization result from Square PaymentForm.
  const handlePayment = async (tokenResult: any) => {
    if (tokenResult.status === 'OK' && tokenResult.token) {
      paymentMutation.mutate({
        sourceId: tokenResult.token,
        shippingAddress,
      });
    } else {
      toast({
        title: 'Card Error',
        description: tokenResult.errors?.[0]?.message || 'Could not process your card. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Determine Square payment configuration. If missing, a user-friendly message will be shown.
  const squareAppId = process.env.NEXT_PUBLIC_SQUARE_APP_ID || '';
  const squareLocationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '';
  const squareConfigured = Boolean(squareAppId && squareLocationId);

  // Render loading spinner while cart data loads.
  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Show an empty cart state with a link back to products if no items are present.
  if (!cart?.items?.length) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-gray-600 mb-8">Add some products to your cart before checking out.</p>
        <Link href="/products">
          <Button data-testid="button-browse-products">Browse Products</Button>
        </Link>
      </div>
    );
  }

  // Calculate subtotal and totals on the client. The server already returns these, but fallback if missing.
  const subtotal = cart.subtotal || cart.items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);
  // Fetch shipping configuration from the server. This query loads
  // `{ shippingCost, freeShipping }` from the settings API. If fetching
  // fails, a fallback of 15 is used. When freeShipping is true, the
  // computed shipping cost will be zero.
  // Retrieve shipping settings via React Query. Provide a generic type
  // argument so that the returned `data` property will have the
  // `automaticShipping` field in addition to `shippingCost` and
  // `freeShipping`. Without specifying the generic type, TypeScript
  // would infer an insufficient type and produce an error when accessing
  // `automaticShipping`.
  const { data: shippingData } = useQuery<
    { shippingCost: number; freeShipping: boolean; automaticShipping: boolean },
    Error
  >({
    queryKey: ["shipping"],
    queryFn: async () => {
      const res = await fetch("/api/settings/shipping");
      if (!res.ok) throw new Error("Failed to load shipping settings");
      return res.json() as Promise<{
        shippingCost: number;
        freeShipping: boolean;
        automaticShipping: boolean;
      }>;
    },
  });
  // Compute shipping based on settings and the number of items in the cart.
  const itemCount = cart.items.length;
  let shipping: number;
  if (shippingData?.freeShipping) {
    shipping = 0;
  } else if (shippingData?.automaticShipping) {
    const base = shippingData?.shippingCost ?? 15;
    shipping = base * itemCount;
  } else {
    shipping = shippingData?.shippingCost ?? 15;
  }
  const total = subtotal + shipping;

  return (
    <div className="container mx-auto px-4 py-20 max-w-6xl">
      <Link href="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping address card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {step === 'shipping' ? (
                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        data-testid="input-first-name"
                        value={shippingAddress.firstName}
                        onChange={(e) => setShippingAddress((prev) => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        data-testid="input-last-name"
                        value={shippingAddress.lastName}
                        onChange={(e) => setShippingAddress((prev) => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address1">Address Line 1 *</Label>
                    <Input
                      id="address1"
                      data-testid="input-address1"
                      value={shippingAddress.address1}
                      onChange={(e) => setShippingAddress((prev) => ({ ...prev, address1: e.target.value }))}
                      placeholder="Street address"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address2">Address Line 2</Label>
                    <Input
                      id="address2"
                      data-testid="input-address2"
                      value={shippingAddress.address2}
                      onChange={(e) => setShippingAddress((prev) => ({ ...prev, address2: e.target.value }))}
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        data-testid="input-city"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress((prev) => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        data-testid="input-state"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress((prev) => ({ ...prev, state: e.target.value }))}
                        placeholder="TX"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP Code *</Label>
                      <Input
                        id="zip"
                        data-testid="input-zip"
                        value={shippingAddress.zip}
                        onChange={(e) => setShippingAddress((prev) => ({ ...prev, zip: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      data-testid="input-phone"
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="For delivery updates"
                    />
                  </div>
                  <Button type="submit" className="w-full" data-testid="button-continue-payment">
                    Continue to Payment
                  </Button>
                </form>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium">
                    {shippingAddress.firstName} {shippingAddress.lastName}
                  </p>
                    <p className="text-gray-600">{shippingAddress.address1}</p>
                    {shippingAddress.address2 && <p className="text-gray-600">{shippingAddress.address2}</p>}
                    <p className="text-gray-600">
                      {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
                    </p>
                    {shippingAddress.phone && <p className="text-gray-600">{shippingAddress.phone}</p>}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStep('shipping')}
                      data-testid="button-edit-shipping"
                    >
                      Edit
                    </Button>
                  </div>
              )}
            </CardContent>
          </Card>

          {/* Payment card shows after shipping step */}
          {step === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMutation.isPending ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    <span className="ml-2">Processing payment...</span>
                  </div>
                ) : !squareConfigured ? (
                  <div className="p-4 bg-red-100 text-red-700 rounded-md text-center">
                    Payment system is not properly configured. Please contact support.
                  </div>
                ) : (
                  <div className="sq-payment-form">
                    <PaymentForm
                      applicationId={squareAppId}
                      locationId={squareLocationId}
                      cardTokenizeResponseReceived={handlePayment}
                      createPaymentRequest={() => ({
                        countryCode: 'US',
                        currencyCode: 'USD',
                        total: {
                          amount: total.toFixed(2),
                          label: 'Total',
                        },
                      })}
                    >
                      <CreditCard
                        buttonProps={{
                          css: {
                            backgroundColor: '#f97316',
                            '&:hover': {
                              backgroundColor: '#ea580c',
                            },
                          },
                        }}
                      />
                    </PaymentForm>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        {/* Order summary sticky card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3" data-testid={`checkout-item-${item.id}`}> 
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {item.design?.previewUrl ? (
                      <Image
                        src={item.design.previewUrl}
                        alt={item.design.name || 'Design preview'}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : item.product.thumbnailUrl ? (
                      <Image
                        src={item.product.thumbnailUrl}
                        alt={item.product.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingCart className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium">${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span data-testid="text-checkout-total">${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}