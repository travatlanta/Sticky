"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PaymentForm, CreditCard as SquareCreditCard } from "react-square-web-payments-sdk";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  Truck,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  Sticker,
  CreditCard,
  FileImage,
  Download,
  Image,
  Phone,
  Mail,
  Upload,
  Trash2,
  Loader2,
  Send,
  Edit,
  Lock,
  Palette,
} from "lucide-react";

interface Design {
  id: number;
  name: string | null;
  previewUrl: string | null;
  artworkUrl: string | null;
  highResExportUrl: string | null;
  customShapeUrl: string | null;
  status?: 'pending' | 'approved' | 'uploaded';
  isAdminDesign?: boolean;
  isCustomerUpload?: boolean;
  isFlagged?: boolean;
}

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: string;
  selectedOptions?: Record<string, any>;
  product?: {
    name: string;
  };
  design?: Design | null;
}

interface Order {
  id: number;
  orderNumber?: string;
  status: string;
  createdAt: string;
  subtotal: string;
  shippingCost?: string;
  discountAmount?: string;
  taxAmount?: string;
  totalAmount: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  shippingAddress?: any;
  notes?: string;
  items?: OrderItem[];
  createdByAdminId?: string | null;
}

interface ArtworkNote {
  id: number;
  orderId: number;
  orderItemId?: number;
  userId: string;
  senderType: 'admin' | 'user';
  content: string;
  isRead: boolean;
  createdAt: string;
  senderName: string;
}

function getArtworkBadgeInfo(design: Design | null | undefined, isAdminCreatedOrder: boolean): { text: string; colorClass: string } {
  if (!design || (!design.previewUrl && !design.highResExportUrl && !design.artworkUrl)) {
    return { text: "No Artwork", colorClass: "bg-red-100 text-red-700" };
  }
  
  const designName = design.name || '';
  const isAdminDesign = designName.includes('[ADMIN_DESIGN]') || design.isAdminDesign;
  const isCustomerUpload = designName.includes('[CUSTOMER_UPLOAD]') || design.isCustomerUpload;
  const isFlagged = designName.includes('[FLAGGED]') || design.isFlagged;
  const isApproved = designName.includes('[APPROVED]') || design.status === 'approved';
  
  if (isApproved) {
    return { text: "Approved", colorClass: "bg-green-100 text-green-700" };
  }
  
  if (isFlagged) {
    return { text: "Needs Your Approval", colorClass: "bg-yellow-100 text-yellow-700" };
  }
  
  if (isAdminDesign) {
    return { text: "Needs Your Approval", colorClass: "bg-yellow-100 text-yellow-700" };
  }
  
  if (isCustomerUpload) {
    return { text: "Ready", colorClass: "bg-green-100 text-green-700" };
  }
  
  if (isAdminCreatedOrder && !isCustomerUpload) {
    return { text: "Needs Your Approval", colorClass: "bg-yellow-100 text-yellow-700" };
  }
  
  return { text: "Ready", colorClass: "bg-green-100 text-green-700" };
}

const statusConfig: Record<string, { icon: any; color: string; label: string; bgColor: string }> = {
  pending: { icon: Clock, color: "text-yellow-600", label: "Pending", bgColor: "bg-yellow-100" },
  paid: { icon: CheckCircle, color: "text-green-600", label: "Paid", bgColor: "bg-green-100" },
  in_production: { icon: Package, color: "text-blue-600", label: "In Production", bgColor: "bg-blue-100" },
  printed: { icon: Package, color: "text-purple-600", label: "Printed", bgColor: "bg-purple-100" },
  shipped: { icon: Truck, color: "text-indigo-600", label: "Shipped", bgColor: "bg-indigo-100" },
  delivered: { icon: CheckCircle, color: "text-green-700", label: "Delivered", bgColor: "bg-green-200" },
  cancelled: { icon: Clock, color: "text-red-600", label: "Cancelled", bgColor: "bg-red-100" },
};

function getProductIcon(productName: string) {
  const name = productName?.toLowerCase() || "";
  if (name.includes("sticker")) return <Sticker className="h-6 w-6 text-orange-500" />;
  if (name.includes("business") || name.includes("card")) return <CreditCard className="h-6 w-6 text-blue-500" />;
  if (name.includes("flyer") || name.includes("poster")) return <FileImage className="h-6 w-6 text-green-500" />;
  return <Package className="h-6 w-6 text-gray-500" />;
}

export default function OrderDetail() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";
  const isAdmin = (session?.user as any)?.isAdmin === true;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [newNote, setNewNote] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [requestChangesItemId, setRequestChangesItemId] = useState<number | null>(null);
  const [approvalConfirmItemId, setApprovalConfirmItemId] = useState<number | null>(null);
  const [changeNotes, setChangeNotes] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Shipping/Billing address editing state
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    name: "",
    street: "",
    street2: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
    phone: "",
  });
  const [billingForm, setBillingForm] = useState({
    name: "",
    street: "",
    street2: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});

  // Handle download for customer (direct URL download, no admin route needed)
  const handleDownload = async (url: string, itemId: number, designName: string) => {
    if (!url) return;
    setDownloading(prev => ({ ...prev, [itemId]: true }));
    try {
      // Fetch directly from the URL (Vercel Blob URLs are publicly accessible)
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'file';
      const filename = `${designName.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the file",
        variant: "destructive"
      });
    } finally {
      setDownloading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Square payment configuration
  const squareAppId = process.env.NEXT_PUBLIC_SQUARE_APP_ID || '';
  const squareLocationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '';
  const squareConfigured = Boolean(squareAppId && squareLocationId);

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: [`/api/orders/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json();
    },
    enabled: isAuthenticated && !!id,
  });

  const uploadArtworkMutation = useMutation({
    mutationFn: async ({ orderItemId, file }: { orderItemId: number; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orderItemId", orderItemId.toString());

      const res = await fetch(`/api/orders/${id}/artwork`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Upload failed");
      return json;
    },
    onSuccess: () => {
      toast({ title: "Artwork uploaded successfully!" });
      setUploadingItemId(null);
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadingItemId(null);
    },
  });

  const removeArtworkMutation = useMutation({
    mutationFn: async (orderItemId: number) => {
      const res = await fetch(`/api/orders/${id}/artwork?orderItemId=${orderItemId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Remove failed");
      return json;
    },
    onSuccess: () => {
      toast({ title: "Artwork removed" });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Remove failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveArtworkMutation = useMutation({
    mutationFn: async (orderItemId: number) => {
      const res = await fetch(`/api/orders/${id}/artwork`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId, action: "approve" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Approval failed");
      return json;
    },
    onSuccess: (data) => {
      toast({ 
        title: "Artwork approved!", 
        description: data.allItemsApproved 
          ? "All items approved - Your order is ready for production!" 
          : "Continue approving other items." 
      });
      setRequestChangesItemId(null);
      setChangeNotes("");
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitArtworkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/orders/${id}/submit-artwork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Submit failed");
      return json;
    },
    onSuccess: (data) => {
      toast({ 
        title: "Artwork Submitted!", 
        description: data.message || "We'll review your artwork and get back to you soon." 
      });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Submit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const flagIssueMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/orders/${id}/flag-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Flag failed");
      return json;
    },
    onSuccess: () => {
      toast({ 
        title: "Issue Flagged", 
        description: "Customer will be notified to review and approve the updated artwork." 
      });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}/artwork`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Flag failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: artworkNotes } = useQuery<{ notes: ArtworkNote[] }>({
    queryKey: ['/api/orders', id, 'artwork-notes'],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}/artwork-notes`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
    enabled: isAuthenticated && !!id,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/orders/${id}/artwork-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add note");
      return json;
    },
    onSuccess: () => {
      toast({ title: "Message sent!" });
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ['/api/orders', id, 'artwork-notes'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize shipping form when order data loads
  useEffect(() => {
    if (order?.shippingAddress) {
      const addr = typeof order.shippingAddress === 'string' 
        ? JSON.parse(order.shippingAddress) 
        : order.shippingAddress;
      setShippingForm({
        name: addr.name || "",
        street: addr.street || "",
        street2: addr.street2 || "",
        city: addr.city || "",
        state: addr.state || "",
        zip: addr.zip || "",
        country: addr.country || "USA",
        phone: addr.phone || "",
      });
    }
  }, [order?.shippingAddress]);

  const handleFileSelect = (orderItemId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingItemId(orderItemId);
      uploadArtworkMutation.mutate({ orderItemId, file });
    }
  };
  
  // Mutation to update shipping address
  const updateShippingMutation = useMutation({
    mutationFn: async (addressData: typeof shippingForm) => {
      const res = await fetch(`/api/orders/${id}/shipping`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update shipping address");
      return json;
    },
    onSuccess: () => {
      toast({ title: "Shipping address updated!" });
      setIsEditingShipping(false);
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSquarePayment = async (token: any, verifiedBuyer?: any) => {
    if (!token?.token) {
      toast({
        title: "Payment Error",
        description: "Could not process card information. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Validate terms acceptance
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "You must accept the Terms & Conditions to complete your order.",
        variant: "destructive",
      });
      return;
    }

    // Validate billing address if not same as shipping
    if (!billingSameAsShipping) {
      if (!billingForm.name || !billingForm.street || !billingForm.city || !billingForm.state || !billingForm.zip) {
        toast({
          title: "Missing Billing Information",
          description: "Please fill in all required billing address fields.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessingPayment(true);
    try {
      // Include billing address with payment
      const billingAddress = billingSameAsShipping
        ? shippingForm
        : billingForm;
        
      const res = await fetch(`/api/orders/${id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          sourceId: token.token,
          billingAddress,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || "Payment failed");
      
      toast({ 
        title: "Payment successful!", 
        description: json.message || "Your order is now being processed.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background">
        <div className="container mx-auto px-4 py-8 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">Order Not Found</h2>
          <p className="text-gray-500 dark:text-muted-foreground mb-6">
            This order doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Link href="/orders">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status || "pending"] || statusConfig.pending;
  const StatusIcon = status.icon;
  const shippingAddress = order.shippingAddress as any;
  
  // Determine if order needs payment (component-level for use in shipping edit button)
  const payableStatuses = ['pending', 'pending_payment', 'awaiting_artwork'];
  const needsPayment = payableStatuses.includes(order.status) && order.notes?.includes('Payment Link:');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container mx-auto px-4 py-8 pb-16 md:pb-20">
        <Link href="/orders">
          <Button variant="ghost" className="mb-6" data-testid="button-back-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
              Order #{order.orderNumber || order.id}
            </h1>
            <p className="text-gray-500 dark:text-muted-foreground flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-2" />
              Placed on{" "}
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }) : "N/A"}
            </p>
          </div>
          <Badge className={`${status.bgColor} ${status.color} px-4 py-2 text-sm`} data-testid="badge-order-status">
            <StatusIcon className="h-4 w-4 mr-2" />
            {status.label}
          </Badge>
        </div>

        {/* Customer Notification Banner - Shows ONE prioritized action */}
        {(() => {
          const isAdminCreatedOrder = !!order.createdByAdminId || 
            (order.notes && (order.notes.includes('Payment Link:') || order.notes.includes('Admin-created')));
          
          // Items with admin designs needing customer approval (NOT flagged - those are revisions)
          const itemsNeedingApproval = order.items?.filter((item: any) => {
            const designName = item.design?.name || '';
            const isAdminDesign = designName.includes('[ADMIN_DESIGN]') || item.design?.isAdminDesign;
            const isFlagged = designName.includes('[FLAGGED]') || item.design?.isFlagged;
            const isApproved = designName.includes('[APPROVED]') || item.design?.status === 'approved';
            // Admin uploaded design that needs approval (not flagged - flagged means revision needed)
            return isAdminDesign && !isFlagged && !isApproved && item.design;
          }) || [];

          // Items with flagged revisions (admin flagged customer's upload for revision)
          const itemsWithRevisionRequest = order.items?.filter((item: any) => {
            const designName = item.design?.name || '';
            const isFlagged = designName.includes('[FLAGGED]') || item.design?.isFlagged;
            const isApproved = designName.includes('[APPROVED]') || item.design?.status === 'approved';
            return isFlagged && !isApproved && item.design;
          }) || [];

          // Items missing any artwork
          const itemsNeedingArtwork = order.items?.filter((item: any) => {
            return !item.design || (!item.design.previewUrl && !item.design.highResExportUrl && !item.design.artworkUrl);
          }) || [];

          // Customer uploads waiting for admin review
          const customerUploadedWaiting = order.items?.filter((item: any) => {
            const designName = item.design?.name || '';
            const isCustomerUpload = designName.includes('[CUSTOMER_UPLOAD]') || item.design?.isCustomerUpload;
            const isApproved = designName.includes('[APPROVED]') || item.design?.status === 'approved';
            const isFlagged = designName.includes('[FLAGGED]') || item.design?.isFlagged;
            const isAdminDesign = designName.includes('[ADMIN_DESIGN]') || item.design?.isAdminDesign;
            const hasArtwork = item.design && (item.design.previewUrl || item.design.artworkUrl || item.design.highResExportUrl);
            return hasArtwork && !isApproved && !isFlagged && !isAdminDesign && (isAdminCreatedOrder || isCustomerUpload);
          }) || [];

          // Show ALL applicable banners stacked
          const showRevision = itemsWithRevisionRequest.length > 0;
          const showApproval = itemsNeedingApproval.length > 0;
          const showArtwork = itemsNeedingArtwork.length > 0 && !isAdminCreatedOrder;
          const showWaiting = customerUploadedWaiting.length > 0;
          const showPayment = needsPayment;

          // If nothing to show, return null
          if (!showRevision && !showApproval && !showArtwork && !showWaiting && !showPayment) {
            return null;
          }

          return (
            <div className="space-y-3 mb-6">
              {showRevision && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3" data-testid="banner-revision-requested">
                  <Edit className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Revision requested</p>
                    <p className="text-sm text-red-700">
                      We've flagged {itemsWithRevisionRequest.length === 1 ? 'an issue with your artwork' : `issues with ${itemsWithRevisionRequest.length} items`}. 
                      Please review and upload revised artwork or approve the changes.
                    </p>
                  </div>
                </div>
              )}

              {showApproval && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3" data-testid="banner-needs-approval">
                  <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-800">Approval required</p>
                    <p className="text-sm text-yellow-700">
                      We've prepared {itemsNeedingApproval.length === 1 ? 'a design' : `${itemsNeedingApproval.length} designs`} for you. 
                      Please review and approve to proceed with printing.
                    </p>
                  </div>
                </div>
              )}

              {showArtwork && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3" data-testid="banner-needs-artwork">
                  <Upload className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800">Artwork required</p>
                    <p className="text-sm text-blue-700">
                      {itemsNeedingArtwork.length === 1 ? '1 item needs' : `${itemsNeedingArtwork.length} items need`} artwork. 
                      Upload or design your artwork to complete your order.
                    </p>
                  </div>
                </div>
              )}

              {showWaiting && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start gap-3" data-testid="banner-waiting-review">
                  <Clock className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-indigo-800">Artwork under review</p>
                    <p className="text-sm text-indigo-700">
                      We're reviewing your uploaded artwork. You'll be notified once it's approved.
                    </p>
                  </div>
                </div>
              )}

              {showPayment && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3" data-testid="banner-needs-payment">
                  <CreditCard className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-orange-800">Payment required</p>
                    <p className="text-sm text-orange-700">
                      Complete your payment below to start production.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item: any) => {
                    const isAdminCreatedOrder = !!order.createdByAdminId;
                    const badgeInfo = getArtworkBadgeInfo(item.design, isAdminCreatedOrder);
                    const hasDesign = item.design && (item.design.highResExportUrl || item.design.previewUrl || item.design.artworkUrl);
                    const previewUrl = item.design?.previewUrl || item.design?.highResExportUrl || item.design?.artworkUrl;
                    const downloadUrl = item.design?.highResExportUrl || item.design?.previewUrl || item.design?.artworkUrl || '';
                    const ext = downloadUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
                    const isPdf = previewUrl?.toLowerCase().includes('.pdf');
                    const isSpecialFormat = hasDesign && ['eps', 'cdr', 'ai', 'psd'].includes(ext);
                    
                    return (
                    <div
                      key={item.id}
                      className="p-4 bg-green-50 dark:bg-muted rounded-lg border border-green-100 dark:border-gray-700"
                      data-testid={`order-item-${item.id}`}
                    >
                      {/* Product Info Header - matches admin style */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-foreground">{item.product?.name || "Product"}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-muted-foreground mt-1">
                            <span>Qty: <strong>{item.quantity}</strong></span>
                            <span>Unit Price: <strong>{formatPrice(item.unitPrice)}</strong></span>
                            <span className="text-green-600 font-semibold">
                              Subtotal: {formatPrice(parseFloat(item.unitPrice) * item.quantity)}
                            </span>
                          </div>
                          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(item.selectedOptions).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs capitalize">
                                  {key}: {String(value)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Artwork Section - Admin Style Layout */}
                      <div className="mt-3 pt-3 border-t">
                        {/* Artwork Header with Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <FileImage className="h-4 w-4 text-orange-500" />
                            Artwork
                          </p>
                          <div className="flex items-center gap-2">
                            {item.product?.name?.toLowerCase().includes('die') || item.product?.name?.toLowerCase().includes('kiss') ? (
                              <Badge className="text-xs bg-purple-100 text-purple-700">
                                Die-Cut
                              </Badge>
                            ) : null}
                            <Badge className={`text-xs ${badgeInfo.colorClass}`} data-testid={`badge-artwork-${item.id}`}>
                              {badgeInfo.text}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Artwork Label */}
                        <p className="text-xs text-gray-500 mb-2">
                          {item.design 
                            ? (item.design.name || 'Untitled').replace(/\[(ADMIN_DESIGN|CUSTOMER_UPLOAD|FLAGGED|APPROVED)\]/g, '').trim()
                            : 'Uploaded Artwork'
                          }
                        </p>
                        
                        {/* Artwork Display Area */}
                        <div className="flex flex-wrap items-start gap-4">
                          {/* Design Preview Thumbnail */}
                          {(() => {
                            if (!hasDesign) {
                              return (
                                <div className="w-24 h-24 flex flex-col items-center justify-center bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] rounded-lg border-2 border-dashed border-gray-300">
                                  <FileImage className="h-8 w-8 text-gray-400" />
                                  <span className="text-xs text-gray-400 mt-1">No artwork</span>
                                </div>
                              );
                            }
                            
                            if (isPdf) {
                              return (
                                <div className="w-24 h-24 flex flex-col items-center justify-center bg-red-50 rounded-lg border-2 border-red-200">
                                  <FileImage className="h-10 w-10 text-red-500" />
                                  <span className="text-xs text-red-600 mt-1 font-medium">PDF File</span>
                                </div>
                              );
                            }
                            
                            return (
                              <img 
                                src={previewUrl}
                                alt="Design preview" 
                                className="w-24 h-24 object-contain bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] rounded-lg border-2 border-gray-200"
                              />
                            );
                          })()}
                          
                          {/* Download and Actions */}
                          <div className="flex flex-col gap-2">
                            {/* Special format notice */}
                            {isSpecialFormat && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-1">
                                <p className="text-xs text-amber-700 font-medium">
                                  {ext.toUpperCase()} files download in original format
                                </p>
                              </div>
                            )}
                            
                            {/* Download Button (no format dropdown for customers) */}
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => {
                                  if (!hasDesign) return;
                                  handleDownload(
                                    downloadUrl,
                                    item.id,
                                    item.design?.name || 'design'
                                  );
                                }}
                                disabled={downloading[item.id] || !hasDesign}
                                className="bg-orange-500"
                                data-testid={`button-download-${item.id}`}
                              >
                                {downloading[item.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Download className="h-4 w-4 mr-2" />
                                )}
                                Download
                              </Button>
                            </div>
                            
                            {/* File format info */}
                            <div className="text-xs text-gray-500 space-y-1">
                              <p>PNG/TIFF preserve transparency</p>
                              <p className="text-amber-600">EPS, CDR, AI, PSD, PDF files download as-is (no conversion available)</p>
                            </div>
                            
                            {/* Die-cut shape download if available */}
                            {item.design?.customShapeUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(
                                  item.design.customShapeUrl,
                                  item.id + 1000,
                                  `${item.design.name || 'design'}_diecut`
                                )}
                                disabled={downloading[item.id + 1000]}
                                className="text-blue-700 border-blue-300"
                                data-testid={`button-download-diecut-${item.id}`}
                              >
                                <FileImage className="h-4 w-4 mr-2" />
                                Download Die-Cut Shape
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Customer Actions: Approve (if needed) and Upload New Design */}
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                          {/* Approve button for customer (when admin sent a design or flagged for revision) */}
                          {(() => {
                            const designName = item.design?.name || '';
                            const isDesignApproved = designName.includes('[APPROVED]') || item.design?.status === 'approved';
                            const isDesignFlagged = designName.includes('[FLAGGED]') || item.design?.isFlagged;
                            const isDesignAdmin = designName.includes('[ADMIN_DESIGN]') || item.design?.isAdminDesign;
                            const needsApproval = !isAdmin && (isDesignAdmin || isDesignFlagged) && !isDesignApproved && hasDesign;
                            
                            if (needsApproval) {
                              return (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-700 border-green-300 hover:bg-green-50"
                                  onClick={() => setApprovalConfirmItemId(item.id)}
                                  disabled={approveArtworkMutation.isPending}
                                  data-testid={`button-approve-artwork-${item.id}`}
                                >
                                  {approveArtworkMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                  )}
                                  Approve Artwork
                                </Button>
                              );
                            }
                            return null;
                          })()}
                          
                          {/* Upload New Design button (always shown for customers) */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-700 border-blue-300"
                            onClick={() => fileInputRefs.current[item.id]?.click()}
                            disabled={uploadingItemId === item.id}
                            data-testid={`button-upload-new-${item.id}`}
                          >
                            {uploadingItemId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Upload className="h-4 w-4 mr-1" />
                            )}
                            Upload File
                          </Button>
                          
                          {/* Open Editor button - allows customers to create/edit design using the built-in editor */}
                          <Link
                            href={item.design?.id 
                              ? `/editor/${item.design.id}?orderId=${id}&itemId=${item.id}&productId=${item.productId}`
                              : `/editor/new?orderId=${id}&itemId=${item.id}&productId=${item.productId}`}
                            data-testid={`button-open-editor-${item.id}`}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-purple-700 border-purple-300"
                            >
                              <Palette className="h-4 w-4 mr-1" />
                              Open Editor
                            </Button>
                          </Link>
                        </div>
                        
                        {/* Hidden file input */}
                        <input
                          type="file"
                          ref={(el) => { fileInputRefs.current[item.id] = el; }}
                          onChange={(e) => handleFileSelect(item.id, e)}
                          accept=".jpg,.jpeg,.png,.pdf,.eps,.ai,.psd,.cdr,.svg"
                          className="hidden"
                          data-testid={`input-file-artwork-${item.id}`}
                        />
                      </div>
                    </div>
                  )})}
                </div>


                {/* Admin: Flag Printing Issue - For customer uploads that need revision */}
                {isAdmin && order.items?.some((item: any) => {
                  const designName = item.design?.name || '';
                  return designName.includes('[CUSTOMER_UPLOAD]') && 
                    !designName.includes('[FLAGGED]') && 
                    !designName.includes('[APPROVED]') &&
                    item.design?.status !== 'approved';
                }) && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-foreground">Printing Issue?</p>
                        <p className="text-sm text-gray-500 dark:text-muted-foreground">
                          Flag an issue to request customer approval after making adjustments
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => flagIssueMutation.mutate()}
                        disabled={flagIssueMutation.isPending}
                        className="w-full sm:w-auto"
                        data-testid="button-flag-issue"
                      >
                        {flagIssueMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Flagging...
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Flag Printing Issue
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notes / Communication Section */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowNotes(!showNotes)}
                    data-testid="toggle-notes-section"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-foreground">
                        Messages {artworkNotes?.notes?.length ? `(${artworkNotes.notes.length})` : ''}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      {showNotes ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  
                  {showNotes && (
                    <div className="mt-4 space-y-4">
                      {/* Message History */}
                      {artworkNotes?.notes && artworkNotes.notes.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {artworkNotes.notes.map((note) => (
                            <div 
                              key={note.id} 
                              className={`p-3 rounded-lg ${
                                note.senderType === 'admin' 
                                  ? 'bg-blue-50 dark:bg-blue-950 ml-4' 
                                  : 'bg-gray-100 dark:bg-gray-800 mr-4'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  {note.senderType === 'admin' ? 'Sticky Banditos' : 'You'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(note.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                {note.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No messages yet. Send a message to communicate with our team about your artwork.
                        </p>
                      )}
                      
                      {/* Add Note Form */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          data-testid="input-new-note"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newNote.trim()) {
                              addNoteMutation.mutate(newNote.trim());
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            if (newNote.trim()) {
                              addNoteMutation.mutate(newNote.trim());
                            }
                          }}
                          disabled={addNoteMutation.isPending || !newNote.trim()}
                          data-testid="button-send-note"
                        >
                          {addNoteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {order.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-indigo-50 dark:bg-indigo-950 rounded-lg p-4">
                    <p className="font-medium text-indigo-900 dark:text-indigo-100">
                      Tracking Number: {order.trackingNumber}
                    </p>
                    {order.trackingCarrier && (
                      <p className="text-indigo-700 dark:text-indigo-300 text-sm mt-1">
                        Carrier: {order.trackingCarrier}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipping Address - Editable if order is not yet paid */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
                {needsPayment && !isEditingShipping && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditingShipping(true)}
                    data-testid="button-edit-shipping"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditingShipping ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name *</label>
                      <input
                        type="text"
                        value={shippingForm.name}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="John Doe"
                        data-testid="input-shipping-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Street Address *</label>
                      <input
                        type="text"
                        value={shippingForm.street}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, street: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="123 Main St"
                        data-testid="input-shipping-street"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Apt/Suite/Unit</label>
                      <input
                        type="text"
                        value={shippingForm.street2}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, street2: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Apt 4B"
                        data-testid="input-shipping-street2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">City *</label>
                        <input
                          type="text"
                          value={shippingForm.city}
                          onChange={(e) => setShippingForm(prev => ({ ...prev, city: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Phoenix"
                          data-testid="input-shipping-city"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">State *</label>
                        <input
                          type="text"
                          value={shippingForm.state}
                          onChange={(e) => setShippingForm(prev => ({ ...prev, state: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="AZ"
                          data-testid="input-shipping-state"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ZIP Code *</label>
                        <input
                          type="text"
                          value={shippingForm.zip}
                          onChange={(e) => setShippingForm(prev => ({ ...prev, zip: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="85001"
                          data-testid="input-shipping-zip"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                        <input
                          type="text"
                          value={shippingForm.country}
                          onChange={(e) => setShippingForm(prev => ({ ...prev, country: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="USA"
                          data-testid="input-shipping-country"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone (optional)</label>
                      <input
                        type="tel"
                        value={shippingForm.phone}
                        onChange={(e) => setShippingForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="602-555-1234"
                        data-testid="input-shipping-phone"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => {
                          if (!shippingForm.name || !shippingForm.street || !shippingForm.city || !shippingForm.state || !shippingForm.zip) {
                            toast({ title: "Please fill in all required fields", variant: "destructive" });
                            return;
                          }
                          updateShippingMutation.mutate(shippingForm);
                        }}
                        disabled={updateShippingMutation.isPending}
                        data-testid="button-save-shipping"
                      >
                        {updateShippingMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : null}
                        Save Address
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingShipping(false)}
                        data-testid="button-cancel-shipping"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : shippingAddress ? (
                  <div className="text-gray-700 dark:text-muted-foreground">
                    <p className="font-medium text-gray-900 dark:text-foreground">
                      {shippingAddress.name}
                    </p>
                    <p>{shippingAddress.street}</p>
                    {shippingAddress.street2 && <p>{shippingAddress.street2}</p>}
                    <p>
                      {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
                    </p>
                    <p>{shippingAddress.country}</p>
                    {shippingAddress.phone && (
                      <p className="mt-2 flex items-center gap-1 text-sm">
                        <Phone className="h-4 w-4" /> {shippingAddress.phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-muted-foreground mb-3">No shipping address on file</p>
                    <Button size="sm" onClick={() => setIsEditingShipping(true)} data-testid="button-add-shipping">
                      Add Shipping Address
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-muted-foreground">Shipping</span>
                    <span className="font-medium">{formatPrice(order.shippingCost || "0")}</span>
                  </div>
                  {parseFloat(order.discountAmount || "0") > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(order.discountAmount || "0")}</span>
                    </div>
                  )}
                  {parseFloat(order.taxAmount || "0") > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-muted-foreground">Tax</span>
                      <span className="font-medium">{formatPrice(order.taxAmount || "0")}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Section - Show if order needs payment */}
            {(() => {
              const totalAmount = parseFloat(order.totalAmount || "0");
              
              if (!needsPayment) return null;
              
              return (
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-orange-600" />
                      Complete Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!squareConfigured ? (
                      <div className="text-center py-4">
                        <p className="text-gray-600 mb-2">Payment processing is currently unavailable.</p>
                        <p className="text-sm text-gray-500">Please contact support at (602) 554-5338.</p>
                      </div>
                    ) : isProcessingPayment ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-4" />
                        <p className="text-gray-600 font-medium">Processing your payment...</p>
                        <p className="text-sm text-gray-500">Please do not close this page.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Billing Address Section */}
                        <div className="bg-white dark:bg-gray-900 border rounded-lg p-4 mb-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Billing Information
                          </h4>
                          
                          <div className="mb-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={billingSameAsShipping}
                                onChange={(e) => {
                                  setBillingSameAsShipping(e.target.checked);
                                  if (e.target.checked) {
                                    setBillingForm({
                                      name: shippingForm.name,
                                      street: shippingForm.street,
                                      street2: shippingForm.street2,
                                      city: shippingForm.city,
                                      state: shippingForm.state,
                                      zip: shippingForm.zip,
                                      country: shippingForm.country,
                                    });
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                data-testid="checkbox-billing-same"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Billing address same as shipping
                              </span>
                            </label>
                          </div>
                          
                          {!billingSameAsShipping && (
                            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                              <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name *</label>
                                <input
                                  type="text"
                                  value={billingForm.name}
                                  onChange={(e) => setBillingForm(prev => ({ ...prev, name: e.target.value }))}
                                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  placeholder="John Doe"
                                  data-testid="input-billing-name"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Street Address *</label>
                                <input
                                  type="text"
                                  value={billingForm.street}
                                  onChange={(e) => setBillingForm(prev => ({ ...prev, street: e.target.value }))}
                                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  placeholder="123 Main St"
                                  data-testid="input-billing-street"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Apt/Suite/Unit</label>
                                <input
                                  type="text"
                                  value={billingForm.street2}
                                  onChange={(e) => setBillingForm(prev => ({ ...prev, street2: e.target.value }))}
                                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  placeholder="Apt 4B"
                                  data-testid="input-billing-street2"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">City *</label>
                                  <input
                                    type="text"
                                    value={billingForm.city}
                                    onChange={(e) => setBillingForm(prev => ({ ...prev, city: e.target.value }))}
                                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Phoenix"
                                    data-testid="input-billing-city"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">State *</label>
                                  <input
                                    type="text"
                                    value={billingForm.state}
                                    onChange={(e) => setBillingForm(prev => ({ ...prev, state: e.target.value }))}
                                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="AZ"
                                    data-testid="input-billing-state"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ZIP Code *</label>
                                  <input
                                    type="text"
                                    value={billingForm.zip}
                                    onChange={(e) => setBillingForm(prev => ({ ...prev, zip: e.target.value }))}
                                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="85001"
                                    data-testid="input-billing-zip"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                                  <input
                                    type="text"
                                    value={billingForm.country}
                                    onChange={(e) => setBillingForm(prev => ({ ...prev, country: e.target.value }))}
                                    className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="USA"
                                    data-testid="input-billing-country"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Terms and Conditions Acceptance */}
                        <div className="bg-white dark:bg-gray-900 border rounded-lg p-4">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={termsAccepted}
                              onChange={(e) => setTermsAccepted(e.target.checked)}
                              className="mt-1 w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                              data-testid="checkbox-terms"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              I have read and agree to the{" "}
                              <a
                                href="/terms"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-600 hover:text-orange-700 underline font-medium"
                                data-testid="link-terms"
                              >
                                Terms & Conditions
                              </a>
                              , including the return policy and refund guidelines.
                            </span>
                          </label>
                          {!termsAccepted && (
                            <p className="text-xs text-red-500 mt-2 ml-8">
                              * You must accept the terms to complete your order
                            </p>
                          )}
                        </div>

                        <div className="bg-white dark:bg-gray-900 border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-semibold">Amount Due</span>
                            <span className="text-2xl font-bold text-orange-600">
                              {formatPrice(totalAmount)}
                            </span>
                          </div>
                          
                          <div className="sq-payment-form">
                            <PaymentForm
                              applicationId={squareAppId}
                              locationId={squareLocationId}
                              cardTokenizeResponseReceived={handleSquarePayment}
                              createPaymentRequest={() => ({
                                countryCode: 'US',
                                currencyCode: 'USD',
                                total: {
                                  amount: totalAmount.toFixed(2),
                                  label: `Order ${order.orderNumber}`,
                                },
                              })}
                            >
                              <SquareCreditCard
                                buttonProps={{
                                  css: {
                                    backgroundColor: '#ea580c',
                                    fontSize: '16px',
                                    color: '#fff',
                                    '&:hover': {
                                      backgroundColor: '#c2410c',
                                    },
                                  },
                                }}
                              />
                            </PaymentForm>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                          <Lock className="h-4 w-4" />
                          <span>Secure payment powered by Square</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {order.notes && (() => {
              // Clean notes: remove payment link tokens and clean up formatting
              const cleanedNotes = order.notes
                .replace(/Payment Link:\s*[a-f0-9-]+/gi, '')
                .replace(/\n\s*\n/g, '\n')
                .trim();
              
              // Only show if there's actual content after cleaning
              return cleanedNotes ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Order Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-muted-foreground whitespace-pre-line">{cleanedNotes}</p>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-muted-foreground text-sm mb-4">
                  Have questions about your order? Our support team is here to help.
                </p>
                <div className="flex flex-col gap-2">
                  <a href="tel:602-554-5338" data-testid="button-contact-support">
                    <Button variant="outline" className="w-full">
                      <Phone className="h-4 w-4 mr-2" />
                      Call (602) 554-5338
                    </Button>
                  </a>
                  <a href="mailto:mhobbs.stickybanditos@gmail.com" data-testid="button-email-support">
                    <Button variant="ghost" className="w-full text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Support
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={approvalConfirmItemId !== null} onOpenChange={(open) => !open && setApprovalConfirmItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize Your Artwork?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                By approving this design, you confirm that your artwork is ready for production.
              </p>
              <p className="font-medium text-orange-600 dark:text-orange-400">
                Once approved, no further edits or changes can be made to this order.
              </p>
              <p>
                Please make sure you've reviewed the design carefully before proceeding.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-approval">
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (approvalConfirmItemId) {
                  approveArtworkMutation.mutate(approvalConfirmItemId);
                  setApprovalConfirmItemId(null);
                }
              }}
              className="bg-green-600"
              data-testid="button-confirm-approval"
            >
              Yes, Approve Design
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
