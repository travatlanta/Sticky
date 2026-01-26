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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  MessageCircle,
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
  productId: number;
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
  const isFlagged = designName.includes('[FLAGGED]') || design.isFlagged;
  const isApproved = designName.includes('[APPROVED]') || design.status === 'approved';
  
  // Priority 1: Approved artwork
  if (isApproved) {
    return { text: "Approved", colorClass: "bg-green-100 text-green-700" };
  }
  
  // Priority 2: Flagged for revision - show clear revision badge
  if (isFlagged) {
    return { text: "Revision Requested", colorClass: "bg-red-100 text-red-700" };
  }
  
  // Everything else is Ready - admin uploads, customer uploads, etc.
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
  const [paymentJustCompleted, setPaymentJustCompleted] = useState(false);
  
  // Revision dialog state
  const [reviseArtworkItemId, setReviseArtworkItemId] = useState<number | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const revisionFileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Cache busting key - increments after each upload to force image refresh
  const [imageRefreshKey, setImageRefreshKey] = useState(0);
  
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
  const [downloadFormats, setDownloadFormats] = useState<Record<number, string>>({});

  // Handle download with format conversion
  const handleDownload = async (url: string, itemId: number, designName: string) => {
    if (!url) return;
    const format = downloadFormats[itemId] || 'png';
    setDownloading(prev => ({ ...prev, [itemId]: true }));
    
    try {
      // Data URLs can be extremely long; passing them as query params causes 414 (URI Too Long).
      // Download them client-side.
      if (url.startsWith('data:')) {
        const mimeMatch = url.match(/^data:([^;]+);base64,/);
        const mime = mimeMatch?.[1] || 'application/octet-stream';
        const base64 = url.split(',')[1] || '';
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const blob = new Blob([bytes], { type: mime });
        const extFromMime =
          mime === 'image/png'
            ? 'png'
            : mime === 'image/jpeg'
              ? 'jpg'
              : mime === 'application/pdf'
                ? 'pdf'
                : (format === 'jpeg' ? 'jpg' : format);

        const filename = `${designName.replace(/[^a-zA-Z0-9]/g, '_')}.${extFromMime}`;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        return;
      }

      const sourceExt = url.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
      const isSpecialFormat = ['eps', 'cdr', 'ai', 'psd', 'pdf'].includes(sourceExt);
      
      // For special formats, download as original
      const downloadFormat = isSpecialFormat ? 'original' : format;
      const downloadUrl = `/api/design-download?url=${encodeURIComponent(url)}&format=${downloadFormat}&filename=${encodeURIComponent(designName)}`;
      
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const ext = isSpecialFormat ? sourceExt : (format === 'jpeg' ? 'jpg' : format);
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

  const { data: order, isLoading, refetch: refetchOrder } = useQuery<Order>({
    queryKey: [`/api/orders/${id}`],
    queryFn: async () => {
      // Add cache-busting timestamp to force fresh data
      const timestamp = Date.now();
      const res = await fetch(`/api/orders/${id}?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      if (!res.ok) throw new Error("Failed to fetch order");
      const data = await res.json();
      // Debug logging for order data
      console.log('[OrderDetail] API Response:', {
        id: data.id,
        status: data.status,
        itemsCount: data.items?.length,
        items: data.items?.map((item: any) => ({
          id: item.id,
          designId: item.designId,
          hasDesign: !!item.design,
          previewUrl: item.design?.previewUrl?.substring(0, 50) || null,
          highResUrl: item.design?.highResExportUrl?.substring(0, 50) || null,
        }))
      });
      return data;
    },
    enabled: isAuthenticated && !!id,
    staleTime: 0, // Always consider data stale to force refetch
    gcTime: 0, // Don't cache the data
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
    onSuccess: async () => {
      toast({ title: "Artwork uploaded successfully!" });
      setUploadingItemId(null);
      // Increment refresh key to force image reload
      setImageRefreshKey(prev => prev + 1);
      // Invalidate related queries and force refetch
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}/artwork`] });
      await refetchOrder();
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
    onSuccess: async () => {
      toast({ title: "Artwork removed" });
      // Invalidate related queries and force refetch
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}/artwork`] });
      await refetchOrder();
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
    onSuccess: async (data) => {
      toast({ 
        title: "Artwork approved!", 
        description: data.allItemsApproved 
          ? "All items approved - Your order is ready for production!" 
          : "Continue approving other items." 
      });
      setRequestChangesItemId(null);
      setChangeNotes("");
      // Invalidate related queries and force refetch
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}/artwork`] });
      await refetchOrder();
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
    onSuccess: async (data) => {
      toast({ 
        title: "Artwork Submitted!", 
        description: data.message || "We'll review your artwork and get back to you soon." 
      });
      // Invalidate related queries and refetch order
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}/artwork`] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      await refetchOrder();
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
    onSuccess: async () => {
      toast({ 
        title: "Issue Flagged", 
        description: "Customer will be notified to review and approve the updated artwork." 
      });
      // Invalidate related queries and refetch order
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}/artwork`] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      await refetchOrder();
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

  // Initialize shipping and billing forms when order data loads
  useEffect(() => {
    if (order?.shippingAddress) {
      const addr = typeof order.shippingAddress === 'string' 
        ? JSON.parse(order.shippingAddress) 
        : order.shippingAddress;
      const formData = {
        name: addr.name || "",
        street: addr.street || "",
        street2: addr.street2 || "",
        city: addr.city || "",
        state: addr.state || "",
        zip: addr.zip || "",
        country: addr.country || "USA",
        phone: addr.phone || "",
      };
      setShippingForm(formData);
      // Also sync billing form when billing is same as shipping
      if (billingSameAsShipping) {
        setBillingForm({
          name: formData.name,
          street: formData.street,
          street2: formData.street2,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        });
      }
    }
  }, [order?.shippingAddress, billingSameAsShipping]);

  const handleFileSelect = (orderItemId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingItemId(orderItemId);
      uploadArtworkMutation.mutate({ orderItemId, file });
    }
  };

  // Handle revision file upload with optional note
  const handleRevisionUpload = async (orderItemId: number, file: File) => {
    setUploadingItemId(orderItemId);
    
    // First add a note if provided
    if (revisionNote.trim()) {
      try {
        await addNoteMutation.mutateAsync(revisionNote);
        // Note added successfully, clear it
        setRevisionNote("");
      } catch (e) {
        console.error('Failed to add note:', e);
        toast({
          title: "Note not saved",
          description: "Your note couldn't be saved, but we'll continue with the upload.",
          variant: "destructive",
        });
      }
    }
    
    // Upload the new artwork
    uploadArtworkMutation.mutate({ orderItemId, file }, {
      onSuccess: () => {
        setReviseArtworkItemId(null);
        setRevisionNote("");
        // Invalidate notes to show updated communication
        queryClient.invalidateQueries({ queryKey: ['/api/orders', id, 'artwork-notes'] });
      },
      onError: () => {
        // Keep dialog open on error so user can retry
        setUploadingItemId(null);
      }
    });
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
    onSuccess: async () => {
      toast({ title: "Shipping address updated!" });
      setIsEditingShipping(false);
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      await refetchOrder();
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle $0 orders - no payment processing needed
  const handleFreeOrder = async () => {
    // Validate terms acceptance
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "You must accept the Terms & Conditions to complete your order.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);
    try {
      const res = await fetch(`/api/orders/${id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          sourceId: "FREE_ORDER",
          billingAddress: shippingForm,
        }),
      });
      const json = await res.json();
      console.log('[OrderDetail] Payment API response:', { status: res.status, json });
      
      // Special handling for "already paid" error - this means the order was paid in another tab/session
      // The backend returns: "Order has already been paid or processed (status: X)"
      const isAlreadyPaidError = !res.ok && json.error && (
        json.error.includes('already been paid') || 
        json.error.includes('already paid') ||
        json.error.includes('Order has already been paid')
      );
      
      if (isAlreadyPaidError) {
        console.log('[OrderDetail] Order was already paid - refreshing to show receipt');
        toast({ 
          title: "Order Already Paid!", 
          description: "Your order has already been confirmed and is being processed.",
        });
        // Mark as completed and force refresh to show the receipt
        setPaymentJustCompleted(true);
        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}/artwork`] });
        await refetchOrder();
        return;
      }
      
      if (!res.ok) {
        console.error('[OrderDetail] Payment failed:', json);
        throw new Error(json.details || json.error || json.message || "Failed to confirm order");
      }
      
      toast({ 
        title: "Order Confirmed!", 
        description: json.message || "Your order is now being processed.",
      });
      
      // Mark payment as just completed for success banner
      setPaymentJustCompleted(true);
      
      // Invalidate all related queries and force refetch immediately
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}/artwork`] });
      await refetchOrder();
    } catch (error: any) {
      toast({
        title: "Failed to confirm order",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

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
      
      // Special handling for "already paid" error - this means the order was paid in another tab/session
      // The backend returns: "Order has already been paid or processed (status: X)"
      const isAlreadyPaidError = !res.ok && json.error && (
        json.error.includes('already been paid') || 
        json.error.includes('already paid') ||
        json.error.includes('Order has already been paid')
      );
      
      if (isAlreadyPaidError) {
        console.log('[OrderDetail] Order was already paid - refreshing to show receipt');
        toast({ 
          title: "Order Already Paid!", 
          description: "Your order has already been confirmed and is being processed.",
        });
        // Mark as completed and force refresh to show the receipt
        setPaymentJustCompleted(true);
        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}/artwork`] });
        await refetchOrder();
        return;
      }
      
      if (!res.ok) throw new Error(json.error || json.message || "Payment failed");
      
      toast({ 
        title: "Payment successful!", 
        description: json.message || "Your order is now being processed.",
      });
      
      // Mark payment as just completed for success banner
      setPaymentJustCompleted(true);
      
      // Invalidate all related queries and force refetch immediately
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}/artwork`] });
      await refetchOrder();
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

  // Normalize status for consistent comparison (handle case differences)
  const orderStatus = order.status?.toLowerCase() || 'pending';
  const status = statusConfig[orderStatus] || statusConfig.pending;
  const StatusIcon = status.icon;
  const shippingAddress = order.shippingAddress as any;
  
  // Determine if order needs payment (component-level for use in shipping edit button)
  // NEVER show payment for already paid or processed orders
  // Use status as the source of truth
  const paidStatuses = ['paid', 'in_production', 'printed', 'shipped', 'delivered', 'completed'];
  const isPaid = paidStatuses.includes(orderStatus);
  const payableStatuses = ['pending', 'pending_payment', 'awaiting_artwork'];
  const needsPayment = !isPaid && payableStatuses.includes(orderStatus) && order.notes?.includes('Payment Link:');
  
  console.log('[OrderDetail] Payment check:', { 
    status: order.status, 
    isPaid, 
    inPayableStatuses: payableStatuses.includes(order.status),
    hasPaymentLink: order.notes?.includes('Payment Link:'),
    needsPayment 
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container mx-auto px-4 py-8 pb-16 md:pb-20">
        <Link href="/orders">
          <Button variant="ghost" className="mb-6" data-testid="button-back-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>

        {/* Payment Success Banner - Shows after successful payment */}
        {(paymentJustCompleted || isPaid) && order.createdByAdminId && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg" data-testid="banner-payment-success">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  {paymentJustCompleted ? "Payment Confirmed!" : "Order Paid"}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  {paymentJustCompleted 
                    ? "Thank you for your payment! A confirmation email has been sent to your email address. Your order is now being processed."
                    : "Your payment has been received and your order is being processed."}
                </p>
              </div>
            </div>
          </div>
        )}

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
          
          // Items needing approval - ONLY items explicitly flagged for revision by admin
          // Regular admin uploads do NOT require approval (they are considered ready)
          const itemsNeedingApproval: any[] = []; // Disabled - admin uploads are auto-approved

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
                        
                        {/* INLINE Revision Notes - appears immediately below badge when flagged */}
                        {(() => {
                          const designName = item.design?.name || '';
                          const isDesignFlagged = designName.includes('[FLAGGED]') || item.design?.isFlagged;
                          const isDesignApproved = designName.includes('[APPROVED]') || item.design?.status === 'approved';
                          
                          // Get the latest admin note for this specific item
                          const itemSpecificNotes = artworkNotes?.notes?.filter((note: ArtworkNote) => 
                            note.senderType === 'admin' && note.orderItemId === item.id
                          ) || [];
                          const orderLevelNotes = artworkNotes?.notes?.filter((note: ArtworkNote) => 
                            note.senderType === 'admin' && !note.orderItemId
                          ) || [];
                          const relevantNotes = itemSpecificNotes.length > 0 ? itemSpecificNotes : orderLevelNotes;
                          const sortedNotes = [...relevantNotes].sort((a, b) => 
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                          );
                          const latestAdminNote = sortedNotes.length > 0 ? sortedNotes[0] : null;
                          
                          if (!isAdmin && isDesignFlagged && !isDesignApproved && latestAdminNote) {
                            return (
                              <div className="mt-2 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-xs font-medium text-red-600 mb-1 flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  Admin Notes:
                                </p>
                                <p className="text-sm text-red-800 whitespace-pre-wrap">
                                  {latestAdminNote.content}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
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
                            
                            // Cache busting using design id and refresh key (only changes after upload)
                            // MUST include format=preview for unauthenticated access
                            const cacheBuster = `&t=${item.design?.id || 0}-${imageRefreshKey}`;
                            return (
                              <img 
                                src={previewUrl.startsWith('data:')
                                  ? previewUrl
                                  : `/api/design-download?url=${encodeURIComponent(previewUrl)}&format=preview${cacheBuster}`}
                                alt="Design preview" 
                                className="w-24 h-24 object-contain bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] rounded-lg border-2 border-gray-200"
                                onError={(e) => {
                                  console.error('[OrderDetail] Image failed to load:', previewUrl?.substring(0, 50));
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
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
                            
                            {/* Download with format selection */}
                            <div className="flex items-center gap-2">
                              {!isSpecialFormat && hasDesign && (
                                <Select
                                  value={downloadFormats[item.id] || 'png'}
                                  onValueChange={(value) => setDownloadFormats(prev => ({ ...prev, [item.id]: value }))}
                                  disabled={!hasDesign}
                                >
                                  <SelectTrigger className="w-24" data-testid={`select-format-${item.id}`}>
                                    <SelectValue placeholder="Format" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="png">PNG</SelectItem>
                                    <SelectItem value="jpeg">JPEG</SelectItem>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                    <SelectItem value="tiff">TIFF</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
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
                                {isSpecialFormat && hasDesign ? `Download ${ext.toUpperCase()}` : 'Download'}
                              </Button>
                            </div>
                            
                            {/* File format info */}
                            <div className="text-xs text-gray-500 space-y-1">
                              <p>PNG/TIFF preserve transparency</p>
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
                        
                        {/* Prominent Revise Artwork button for flagged items */}
                        {(() => {
                          const designName = item.design?.name || '';
                          const isDesignFlagged = designName.includes('[FLAGGED]') || item.design?.isFlagged;
                          const isDesignApproved = designName.includes('[APPROVED]') || item.design?.status === 'approved';
                          
                          // Get the latest admin note for this specific item
                          // Priority: 1) notes for this specific item, 2) order-level notes (no orderItemId)
                          const itemSpecificNotes = artworkNotes?.notes?.filter((note: ArtworkNote) => 
                            note.senderType === 'admin' && note.orderItemId === item.id
                          ) || [];
                          
                          // If no item-specific notes, check for order-level admin notes
                          const orderLevelNotes = artworkNotes?.notes?.filter((note: ArtworkNote) => 
                            note.senderType === 'admin' && !note.orderItemId
                          ) || [];
                          
                          // Prefer item-specific notes, fallback to order-level notes
                          const relevantNotes = itemSpecificNotes.length > 0 ? itemSpecificNotes : orderLevelNotes;
                          
                          // Get the most recent note (sorted by createdAt)
                          const sortedNotes = [...relevantNotes].sort((a, b) => 
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                          );
                          const latestAdminNote = sortedNotes.length > 0 ? sortedNotes[0] : null;
                          
                          if (!isAdmin && isDesignFlagged && !isDesignApproved) {
                            return (
                              <div className="mt-3 pt-3 border-t border-red-200">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <Edit className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="font-medium text-red-800">Revision Requested</p>
                                      
                                      {/* Show admin notes prominently */}
                                      {latestAdminNote ? (
                                        <div className="my-3 p-3 bg-white border border-red-200 rounded-lg">
                                          <p className="text-xs font-medium text-gray-500 mb-1">
                                            Message from Sticky Banditos:
                                          </p>
                                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                            {latestAdminNote.content}
                                          </p>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-red-700 mb-3">
                                          We've flagged an issue with your artwork. Please review and upload revised artwork, or approve if the current design is acceptable.
                                        </p>
                                      )}
                                      
                                      <p className="text-sm text-red-700 mb-3">
                                        Use the <strong>Open Editor</strong> button to edit your design, or <strong>Upload File</strong> to submit new artwork.
                                      </p>
                                      
                                      <div className="flex flex-wrap gap-2">
                                        <Link
                                          href={item.design?.id 
                                            ? `/editor/${item.design.id}?orderId=${id}&itemId=${item.id}&productId=${item.productId}`
                                            : `/editor/new?orderId=${id}&itemId=${item.id}&productId=${item.productId}`}
                                        >
                                          <Button
                                            variant="destructive"
                                            data-testid={`button-revise-editor-${item.id}`}
                                          >
                                            <Palette className="h-4 w-4 mr-2" />
                                            Open Editor
                                          </Button>
                                        </Link>
                                        <Button
                                          variant="outline"
                                          className="border-red-300 text-red-700 hover:bg-red-100"
                                          onClick={() => fileInputRefs.current[item.id]?.click()}
                                          disabled={uploadingItemId === item.id}
                                          data-testid={`button-upload-revision-${item.id}`}
                                        >
                                          {uploadingItemId === item.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                          ) : (
                                            <Upload className="h-4 w-4 mr-2" />
                                          )}
                                          Upload New File
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          className="text-gray-600"
                                          onClick={() => setApprovalConfirmItemId(item.id)}
                                          disabled={approveArtworkMutation.isPending}
                                          data-testid={`button-approve-anyway-${item.id}`}
                                        >
                                          {approveArtworkMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                          ) : (
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                          )}
                                          Approve As Is
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* Customer Actions: Approve (if needed) and Upload New Design */}
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                          {/* Approve button for customer (when admin sent a design - not flagged) */}
                          {(() => {
                            const designName = item.design?.name || '';
                            const isDesignApproved = designName.includes('[APPROVED]') || item.design?.status === 'approved';
                            const isDesignFlagged = designName.includes('[FLAGGED]') || item.design?.isFlagged;
                            const isDesignAdmin = designName.includes('[ADMIN_DESIGN]') || item.design?.isAdminDesign;
                            // Only show for admin designs that are NOT flagged (flagged gets its own section above)
                            const needsApproval = !isAdmin && isDesignAdmin && !isDesignFlagged && !isDesignApproved && hasDesign;
                            
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
              
              // Show receipt/confirmation for paid orders
              if (isPaid) {
                return (
                  <Card className="border-green-200 bg-green-50/50" data-testid="card-payment-receipt">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        Payment Complete
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center py-4">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-green-800 mb-2">Thank You for Your Order!</h3>
                          <p className="text-green-700">
                            Your payment of <span className="font-bold">${totalAmount.toFixed(2)}</span> has been received.
                          </p>
                          <p className="text-sm text-green-600 mt-2">
                            A confirmation email has been sent to your email address.
                          </p>
                        </div>
                        
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-medium text-gray-700 mb-2">Order Summary</h4>
                          <div className="flex justify-between text-sm">
                            <span>Order Number:</span>
                            <span className="font-mono font-medium">{order.orderNumber || order.id}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span>Status:</span>
                            <Badge className="bg-green-100 text-green-700">{status.label}</Badge>
                          </div>
                          
                          {/* Order Notes Section - Right under status badge */}
                          {order.notes && (() => {
                            const cleanedNotes = order.notes
                              .replace(/Payment Link:\s*[a-f0-9-]+/gi, '')
                              .replace(/\n\s*\n/g, '\n')
                              .trim();
                            
                            return cleanedNotes ? (
                              <div className="mt-3 pt-3 border-t border-green-200">
                                <p className="text-xs font-medium text-green-800 mb-1">Order Notes:</p>
                                <p className="text-sm text-green-700 whitespace-pre-line">{cleanedNotes}</p>
                              </div>
                            ) : null;
                          })()}
                          
                          <div className="flex justify-between text-sm mt-1">
                            <span>Total Paid:</span>
                            <span className="font-bold text-green-600">${totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 text-center mt-4">
                          Questions? Contact us at (602) 554-5338 or mhobbs.stickybanditos@gmail.com
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              
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
                          
                          {totalAmount === 0 ? (
                            /* $0 orders - show simple confirm button instead of payment form */
                            <div className="space-y-3">
                              <p className="text-sm text-gray-600 text-center">
                                No payment required for this order.
                              </p>
                              <Button
                                onClick={handleFreeOrder}
                                disabled={!termsAccepted || isProcessingPayment}
                                size="lg"
                                className="w-full"
                                data-testid="button-confirm-free-order"
                              >
                                {isProcessingPayment ? (
                                  <>
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    Confirming...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Confirm Order
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
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
                                createVerificationDetails={() => {
                                  const billingAddr = billingSameAsShipping ? shippingForm : billingForm;
                                  const nameParts = (billingAddr.name || '').split(' ');
                                  return {
                                    amount: totalAmount.toFixed(2),
                                    currencyCode: 'USD',
                                    intent: 'CHARGE',
                                    billingContact: {
                                      givenName: nameParts[0] || '',
                                      familyName: nameParts.slice(1).join(' ') || '',
                                      addressLines: [billingAddr.street || '', billingAddr.street2 || ''].filter(Boolean),
                                      city: billingAddr.city || '',
                                      state: billingAddr.state || '',
                                      postalCode: billingAddr.zip || '',
                                      countryCode: billingAddr.country === 'USA' ? 'US' : (billingAddr.country || 'US'),
                                    },
                                  };
                                }}
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
                          )}
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

      {/* Revise Artwork Dialog */}
      <Dialog open={reviseArtworkItemId !== null} onOpenChange={(open) => !open && setReviseArtworkItemId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-red-600" />
              Revise Your Artwork
            </DialogTitle>
            <DialogDescription>
              Choose how you'd like to revise your artwork. You can upload a new file or use our design editor.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Notes Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Add a note (optional)
              </label>
              <Textarea
                placeholder="Describe the changes you're making or ask questions..."
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                className="min-h-[80px]"
                data-testid="textarea-revision-note"
              />
              <p className="text-xs text-gray-500">
                This note will be visible to our team for reference.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="grid gap-3">
              {/* Upload New File */}
              <div 
                className="border rounded-lg p-4 cursor-pointer hover-elevate"
                onClick={() => revisionFileInputRef.current?.click()}
                data-testid="button-upload-revision-file"
              >
                <div className="flex items-center gap-3">
                  {uploadingItemId === reviseArtworkItemId ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  ) : (
                    <Upload className="h-6 w-6 text-blue-600" />
                  )}
                  <div>
                    <p className="font-medium">Upload New File</p>
                    <p className="text-sm text-gray-500">
                      Upload a revised JPG, PNG, PDF, EPS, AI, PSD, or CDR file
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Open Editor */}
              {reviseArtworkItemId && (
                <Link
                  href={(() => {
                    const item = order?.items?.find((i: any) => i.id === reviseArtworkItemId);
                    return item?.design?.id 
                      ? `/editor/${item.design.id}?orderId=${id}&itemId=${reviseArtworkItemId}&productId=${item?.productId}`
                      : `/editor/new?orderId=${id}&itemId=${reviseArtworkItemId}&productId=${order?.items?.find((i: any) => i.id === reviseArtworkItemId)?.productId}`;
                  })()}
                  onClick={() => setReviseArtworkItemId(null)}
                  data-testid="button-open-editor-revision"
                >
                  <div className="border rounded-lg p-4 hover-elevate">
                    <div className="flex items-center gap-3">
                      <Palette className="h-6 w-6 text-purple-600" />
                      <div>
                        <p className="font-medium">Open Design Editor</p>
                        <p className="text-sm text-gray-500">
                          Edit your design using our built-in editor with shapes, text, and more
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
            
            {/* Previous Notes */}
            {artworkNotes?.notes && artworkNotes.notes.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Previous Messages
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {artworkNotes.notes.slice(0, 5).map((note: ArtworkNote) => (
                    <div
                      key={note.id}
                      className={`p-2 rounded-lg text-sm ${
                        note.senderType === 'admin'
                          ? 'bg-blue-50 border border-blue-100'
                          : 'bg-gray-50 border border-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-xs">
                          {note.senderType === 'admin' ? 'Team' : 'You'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviseArtworkItemId(null);
                setRevisionNote("");
              }}
              data-testid="button-cancel-revision"
            >
              Cancel
            </Button>
          </DialogFooter>
          
          {/* Hidden file input for revision uploads */}
          <input
            type="file"
            ref={revisionFileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && reviseArtworkItemId) {
                handleRevisionUpload(reviseArtworkItemId, file);
              }
            }}
            accept=".jpg,.jpeg,.png,.pdf,.eps,.ai,.psd,.cdr,.svg"
            className="hidden"
            data-testid="input-file-revision"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
