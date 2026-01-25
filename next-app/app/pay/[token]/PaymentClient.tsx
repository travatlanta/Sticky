"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import {
  Package,
  CreditCard,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShoppingCart,
  MapPin,
  User,
  Lock,
  Mail,
} from "lucide-react";
import Link from "next/link";

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: string;
  selectedOptions: Record<string, string> | null;
  product?: {
    name: string;
    thumbnailUrl: string | null;
  };
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  hasAccount: boolean;
  subtotal: string;
  shippingCost: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  shippingAddress: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  } | null;
  items: OrderItem[];
}

export default function PaymentClient({ token }: { token: string }) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery<Order>({
    queryKey: ["/api/orders/by-token", token],
    queryFn: async () => {
      const res = await fetch(`/api/orders/by-token/${token}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Order not found");
      }
      return res.json();
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/orders/by-token/${token}/pay`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Payment failed");
      return json;
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({ title: "Payment initiated" });
        queryClient.invalidateQueries({ queryKey: ["/api/orders/by-token", token] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      const res = await fetch(`/api/orders/by-token/${token}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Registration failed");
      return json;
    },
    onSuccess: async (data) => {
      toast({ title: "Account created!", description: "Please log in to continue." });
      setAccountCreated(true);
      setShowLoginForm(true);
      setPassword("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ["/api/orders/by-token", token] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order?.customerEmail) return;
    
    const result = await signIn("credentials", {
      email: order.customerEmail,
      password: loginPassword,
      redirect: false,
    });
    
    if (result?.error) {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } else {
      toast({ title: "Logged in successfully!" });
      router.refresh();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" />
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">
              This payment link may have expired or the order has already been processed.
            </p>
            <Link href="/">
              <Button>Return to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Orders with these statuses still need payment/action
  const payableStatuses = ["pending", "pending_payment", "awaiting_artwork"];
  const isPayable = payableStatuses.includes(order.status);
  
  if (!isPayable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Order Already Processed</h2>
            <p className="text-gray-600 mb-2">
              Order <strong>{order.orderNumber}</strong> has already been paid.
            </p>
            <p className="text-gray-600 mb-6">
              Current status: <span className="font-medium capitalize">{order.status.replace("_", " ")}</span>
            </p>
            {session ? (
              <Link href="/account">
                <Button>View My Orders</Button>
              </Link>
            ) : (
              <Link href="/">
                <Button>Return to Homepage</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Complete Your Payment</h1>
          <p className="text-gray-600 mt-2">
            Order #{order.orderNumber}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3 border-b last:border-b-0"
                >
                  {item.product?.thumbnailUrl ? (
                    <img
                      src={item.product.thumbnailUrl}
                      alt={item.product?.name || "Product"}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {item.product?.name || `Product #${item.productId}`}
                    </h4>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Object.entries(item.selectedOptions).map(([key, val]) => (
                          <span key={key} className="mr-2">
                            {key}: {val}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      {formatPrice(parseFloat(item.unitPrice) * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}

              <div className="pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(parseFloat(order.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{formatPrice(parseFloat(order.shippingCost))}</span>
                </div>
                {parseFloat(order.taxAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatPrice(parseFloat(order.taxAmount))}</span>
                  </div>
                )}
                {parseFloat(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(parseFloat(order.discountAmount))}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(parseFloat(order.totalAmount))}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.shippingAddress && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {sessionStatus === "unauthenticated" && !order.hasAccount && !accountCreated && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Create Your Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Create an account to track your order and manage future orders.
                Your email is already set from your order.
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="flex items-center gap-2 mt-1 p-2 bg-gray-100 rounded border">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{order.customerEmail}</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min 6 characters)"
                    className="mt-1"
                    data-testid="input-register-password"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="mt-1"
                    data-testid="input-register-confirm-password"
                  />
                </div>
                
                <Button
                  className="w-full"
                  onClick={() => registerMutation.mutate()}
                  disabled={registerMutation.isPending || password.length < 6 || password !== confirmPassword}
                  data-testid="button-create-account"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account & Continue"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {sessionStatus === "unauthenticated" && (order.hasAccount || showLoginForm) && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5" />
                Log In to Continue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accountCreated && (
                <div className="bg-green-100 border border-green-200 rounded p-3 mb-4 text-sm text-green-800">
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  Account created! Please log in with your new password.
                </div>
              )}
              
              <p className="text-sm text-gray-600 mb-4">
                {order.hasAccount 
                  ? "You already have an account. Please log in to continue."
                  : "Log in to continue with your payment."}
              </p>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="flex items-center gap-2 mt-1 p-2 bg-gray-100 rounded border">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{order.customerEmail}</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="loginPassword" className="text-sm font-medium">Password</Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="mt-1"
                    data-testid="input-login-password"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!loginPassword}
                  data-testid="button-login"
                >
                  Log In & Continue
                </Button>
              </form>
              
              {order.hasAccount && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  <Link href="/forgot-password" className="text-blue-600 hover:underline">
                    Forgot your password?
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600"
              size="lg"
              onClick={() => paymentMutation.mutate()}
              disabled={paymentMutation.isPending}
              data-testid="button-pay-now"
            >
              {paymentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay {formatPrice(parseFloat(order.totalAmount))}
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Secure payment powered by Square
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
