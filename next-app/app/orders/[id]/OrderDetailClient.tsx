"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
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

  const handleFileSelect = (orderItemId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingItemId(orderItemId);
      uploadArtworkMutation.mutate({ orderItemId, file });
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

        {/* Customer Notification Banners */}
        {(() => {
          const isAdminCreatedOrder = !!order.createdByAdminId || 
            (order.notes && (order.notes.includes('Payment Link:') || order.notes.includes('Admin-created')));
          
          const itemsNeedingApproval = order.items?.filter((item: any) => {
            const designName = item.design?.name || '';
            const isAdminDesign = designName.includes('[ADMIN_DESIGN]') || item.design?.isAdminDesign;
            const isFlagged = designName.includes('[FLAGGED]') || item.design?.isFlagged;
            const isApproved = designName.includes('[APPROVED]') || item.design?.status === 'approved';
            return (isAdminDesign || isFlagged) && !isApproved && item.design;
          }) || [];

          const itemsNeedingArtwork = order.items?.filter((item: any) => {
            return !item.design || (!item.design.previewUrl && !item.design.highResExportUrl && !item.design.artworkUrl);
          }) || [];

          const customerUploadedWaiting = order.items?.filter((item: any) => {
            const designName = item.design?.name || '';
            const isCustomerUpload = designName.includes('[CUSTOMER_UPLOAD]') || item.design?.isCustomerUpload;
            const isApproved = designName.includes('[APPROVED]') || item.design?.status === 'approved';
            const isFlagged = designName.includes('[FLAGGED]') || item.design?.isFlagged;
            const isAdminDesign = designName.includes('[ADMIN_DESIGN]') || item.design?.isAdminDesign;
            // For admin-created orders, customer uploads need admin review
            // Also show if there's artwork without any tag and admin hasn't approved yet
            const hasArtwork = item.design && (item.design.previewUrl || item.design.artworkUrl || item.design.highResExportUrl);
            return hasArtwork && !isApproved && !isFlagged && !isAdminDesign && (isAdminCreatedOrder || isCustomerUpload);
          }) || [];

          const needsPayment = order.status === 'pending' && order.notes?.includes('Payment Link:');

          return (
            <div className="space-y-3 mb-6">
              {itemsNeedingApproval.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3" data-testid="banner-needs-approval">
                  <Edit className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-800">Artwork needs your approval</p>
                    <p className="text-sm text-yellow-700">
                      We've prepared {itemsNeedingApproval.length === 1 ? 'a design' : `${itemsNeedingApproval.length} designs`} for you to review. 
                      Please approve to proceed with printing.
                    </p>
                  </div>
                </div>
              )}

              {itemsNeedingArtwork.length > 0 && !isAdminCreatedOrder && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3" data-testid="banner-needs-artwork">
                  <Upload className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800">Upload your artwork</p>
                    <p className="text-sm text-blue-700">
                      {itemsNeedingArtwork.length === 1 ? '1 item needs' : `${itemsNeedingArtwork.length} items need`} artwork. 
                      Upload your designs to complete your order.
                    </p>
                  </div>
                </div>
              )}

              {customerUploadedWaiting.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start gap-3" data-testid="banner-waiting-review">
                  <Clock className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-indigo-800">Artwork waiting for review</p>
                    <p className="text-sm text-indigo-700">
                      We're reviewing your uploaded artwork. You'll be notified once it's approved.
                    </p>
                  </div>
                </div>
              )}

              {needsPayment && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3" data-testid="banner-needs-payment">
                  <CreditCard className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-orange-800">Payment required</p>
                    <p className="text-sm text-orange-700">
                      Complete your payment to start production. Check your email for the payment link.
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
                  {order.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 bg-gray-50 dark:bg-muted rounded-lg"
                      data-testid={`order-item-${item.id}`}
                    >
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-white dark:bg-background rounded-lg flex items-center justify-center flex-shrink-0 border overflow-hidden">
                          {item.design?.previewUrl ? (
                            <img src={item.design.previewUrl} alt="Design preview" className="w-full h-full object-cover" />
                          ) : (
                            getProductIcon(item.product?.name || "")
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-foreground">
                            {item.product?.name || "Product"}
                          </h4>
                          {item.design?.name && (
                            <p className="text-sm text-gray-500 dark:text-muted-foreground">
                              Design: {item.design.name}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {Object.entries(item.selectedOptions).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {String(value)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-foreground">
                            {formatPrice(parseFloat(item.unitPrice) * item.quantity)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-muted-foreground">
                            {formatPrice(item.unitPrice)} each
                          </p>
                        </div>
                      </div>
                      
                      {/* Artwork Upload Section */}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        {(() => {
                          const isAdminCreatedOrder = !!order.createdByAdminId;
                          const badgeInfo = getArtworkBadgeInfo(item.design, isAdminCreatedOrder);
                          return (
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium flex items-center gap-2">
                                <FileImage className="h-4 w-4" />
                                Artwork
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${badgeInfo.colorClass}`} data-testid={`badge-artwork-${item.id}`}>
                                {badgeInfo.text}
                              </span>
                            </div>
                          );
                        })()}

                        {item.design?.artworkUrl || item.design?.previewUrl ? (
                          <div className="flex items-center gap-3">
                            <a 
                              href={item.design.artworkUrl || item.design.previewUrl || "#"} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={item.design.artworkUrl || item.design.previewUrl || ""}
                                alt="Your artwork"
                                className="w-20 h-20 object-contain border rounded bg-white dark:bg-gray-800"
                              />
                            </a>
                            <div className="flex-1">
                              {(() => {
                                const designName = item.design?.name || '';
                                const isDesignApproved = designName.includes('[APPROVED]') || item.design?.status === 'approved';
                                const isDesignFlagged = designName.includes('[FLAGGED]') || item.design?.isFlagged;
                                const isDesignAdmin = designName.includes('[ADMIN_DESIGN]') || item.design?.isAdminDesign;
                                
                                if (isDesignApproved) {
                                  return (
                                    <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                                      <CheckCircle className="h-4 w-4" />
                                      Artwork Approved - Ready for Printing
                                    </p>
                                  );
                                }
                                if (isDesignFlagged) {
                                  return (
                                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                      We've made adjustments to your design. Please review and approve to continue.
                                    </p>
                                  );
                                }
                                if (isDesignAdmin) {
                                  return (
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                      We've created a design for you. Please review and approve to continue.
                                    </p>
                                  );
                                }
                                return (
                                  <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                    Your artwork has been uploaded and is ready for printing.
                                  </p>
                                );
                              })()}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {(() => {
                                  const designName = item.design?.name || '';
                                  const isDesignApproved = designName.includes('[APPROVED]') || item.design?.status === 'approved';
                                  const isDesignFlagged = designName.includes('[FLAGGED]') || item.design?.isFlagged;
                                  const isDesignAdmin = designName.includes('[ADMIN_DESIGN]') || item.design?.isAdminDesign;
                                  const needsApproval = !isAdmin && (isDesignAdmin || isDesignFlagged) && !isDesignApproved;
                                  
                                  if (needsApproval) {
                                    return (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => setApprovalConfirmItemId(item.id)}
                                          disabled={approveArtworkMutation.isPending}
                                          className="bg-green-600"
                                          data-testid={`button-approve-artwork-${item.id}`}
                                        >
                                          {approveArtworkMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <>
                                              <CheckCircle className="h-4 w-4 mr-1" />
                                              Approve Design
                                            </>
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setRequestChangesItemId(requestChangesItemId === item.id ? null : item.id)}
                                          data-testid={`button-request-changes-${item.id}`}
                                        >
                                          <Edit className="h-4 w-4 mr-1" />
                                          Request Changes
                                        </Button>
                                      </>
                                    );
                                  }
                                  
                                  if (!isDesignApproved) {
                                    return (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => fileInputRefs.current[item.id]?.click()}
                                          disabled={uploadingItemId === item.id}
                                          data-testid={`button-edit-artwork-${item.id}`}
                                        >
                                          {uploadingItemId === item.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <>
                                              <Upload className="h-4 w-4 mr-1" />
                                              Replace
                                            </>
                                          )}
                                        </Button>
                                        {item.design?.id && (
                                          <Link href={`/editor/${item.design.id}`}>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              data-testid={`button-open-editor-${item.id}`}
                                            >
                                              <Edit className="h-4 w-4 mr-1" />
                                              Open Editor
                                            </Button>
                                          </Link>
                                        )}
                                      </>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              
                              {requestChangesItemId === item.id && (
                                <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                  <h4 className="font-medium text-gray-900 dark:text-foreground mb-3">
                                    Request Changes
                                  </h4>
                                  
                                  <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Design:</p>
                                    {(item.design?.previewUrl || item.design?.artworkUrl) && (
                                      <img 
                                        src={item.design.previewUrl || item.design.artworkUrl || ''} 
                                        alt="Current design"
                                        className="w-32 h-32 object-contain bg-gray-100 rounded border mx-auto"
                                        data-testid={`img-current-design-${item.id}`}
                                      />
                                    )}
                                  </div>
                                  
                                  <div className="mb-4">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                                      Tell us what changes you'd like:
                                    </label>
                                    <textarea
                                      value={changeNotes}
                                      onChange={(e) => setChangeNotes(e.target.value)}
                                      placeholder="Describe the changes you need... (e.g., 'Make the logo bigger', 'Change the background color to blue', 'Add my phone number')"
                                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                      rows={3}
                                      data-testid={`textarea-change-notes-${item.id}`}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Be as specific as possible so we can get your design right the first time!
                                    </p>
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 dark:text-muted-foreground mb-4">
                                    You can also upload your own artwork or edit the current design directly:
                                  </p>
                                  
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => fileInputRefs.current[item.id]?.click()}
                                      disabled={uploadingItemId === item.id}
                                      data-testid={`button-upload-new-${item.id}`}
                                    >
                                      {uploadingItemId === item.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                      ) : (
                                        <Upload className="h-4 w-4 mr-1" />
                                      )}
                                      Upload New Artwork
                                    </Button>
                                    {item.design?.id && (
                                      <Link href={`/editor/${item.design.id}`}>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          data-testid={`button-edit-design-${item.id}`}
                                        >
                                          <Edit className="h-4 w-4 mr-1" />
                                          Edit This Design
                                        </Button>
                                      </Link>
                                    )}
                                  </div>
                                  
                                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                      <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                      <span>
                                        <strong>Need help?</strong> Use the Messages section below to send your notes and chat with our team. 
                                        We'll work with you to get your design just right!
                                      </span>
                                    </p>
                                  </div>
                                  
                                  <p className="text-xs text-gray-500 mt-3">
                                    Accepts: JPG, PNG, PDF, EPS, AI, PSD, SVG, CDR
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 dark:text-muted-foreground mb-3">
                              Upload your artwork for this product
                            </p>
                            <Button
                              size="sm"
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
                            <p className="text-xs text-gray-500 mt-2">
                              Accepts: JPG, PNG, PDF, EPS, AI, PSD, SVG
                            </p>
                          </div>
                        )}

                        <input
                          type="file"
                          ref={(el) => { fileInputRefs.current[item.id] = el; }}
                          onChange={(e) => handleFileSelect(item.id, e)}
                          accept=".jpg,.jpeg,.png,.pdf,.eps,.ai,.psd,.cdr,.svg"
                          className="hidden"
                          data-testid={`input-file-artwork-${item.id}`}
                        />
                      </div>

                      {item.design && (item.design.highResExportUrl || item.design.customShapeUrl) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            <Image className="h-3 w-3" />
                            Print-Ready Files
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.design.highResExportUrl && (
                              <a
                                href={item.design.highResExportUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                data-testid={`download-highres-${item.id}`}
                              >
                                <Button size="sm" variant="outline" className="gap-1">
                                  <Download className="h-3 w-3" />
                                  High-Res Design
                                </Button>
                              </a>
                            )}
                            {item.design.customShapeUrl && (
                              <a
                                href={item.design.customShapeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                data-testid={`download-shape-${item.id}`}
                              >
                                <Button size="sm" variant="outline" className="gap-1">
                                  <Download className="h-3 w-3" />
                                  Custom Shape
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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

            {shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                  </div>
                </CardContent>
              </Card>
            )}
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
