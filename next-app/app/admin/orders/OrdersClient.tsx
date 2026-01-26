"use client";

import { useState, useEffect } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShoppingCart, Eye, X, RefreshCw, Truck, Palette, User, Mail, Phone, MapPin, DollarSign, Download, FileImage, Package, Trash2, ZoomIn, FileText, Send, Plus, Upload, RotateCcw, Check } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { jsPDF } from "jspdf";

interface OrderUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

interface Order {
  id: number;
  orderNumber?: string;
  userId: string;
  status: string;
  subtotal: string;
  shippingCost: string;
  taxAmount?: string;
  discountAmount?: string;
  totalAmount: string;
  trackingNumber: string | null;
  trackingCarrier?: string | null;
  notes?: string | null;
  artworkStatus?: string;
  customerArtworkUrl?: string;
  adminDesignId?: number;
  artworkNotes?: string;
  createdByAdminId?: string | null;
  createdAt: string;
  shippingAddress: any;
  billingAddress?: any;
  items?: any[];
  user?: OrderUser | null;
  adminDesign?: {
    id: number;
    name: string;
    thumbnailUrl?: string;
  };
}

const statusOptions = [
  "pending_payment",
  "pending",
  "paid",
  "in_production",
  "printed",
  "shipped",
  "delivered",
  "cancelled",
];

const statusColors: Record<string, string> = {
  pending_payment: "bg-orange-100 text-orange-800",
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  in_production: "bg-purple-100 text-purple-800",
  printed: "bg-indigo-100 text-indigo-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const artworkStatusColors: Record<string, string> = {
  awaiting_artwork: "bg-yellow-100 text-yellow-800",
  customer_designing: "bg-blue-100 text-blue-800",
  artwork_uploaded: "bg-purple-100 text-purple-800",
  admin_designing: "bg-indigo-100 text-indigo-800",
  pending_approval: "bg-orange-100 text-orange-800",
  revision_requested: "bg-red-100 text-red-800",
  approved: "bg-green-100 text-green-800",
};

// Helper function to determine artwork badge for an item
function getArtworkBadgeInfo(design: any, isAdminCreatedOrder: boolean): { text: string; colorClass: string } {
  if (!design || (!design.previewUrl && !design.highResExportUrl)) {
    return { text: "No Artwork", colorClass: "bg-red-100 text-red-800" };
  }
  
  const designName = design.name || '';
  const isAdminDesign = designName.includes('[ADMIN_DESIGN]');
  const isCustomerUpload = designName.includes('[CUSTOMER_UPLOAD]');
  const isFlagged = designName.includes('[FLAGGED]');
  const isApproved = designName.includes('[APPROVED]') || design.status === 'approved';
  
  if (isApproved) {
    return { text: "Approved", colorClass: "bg-green-100 text-green-800" };
  }
  
  if (isFlagged) {
    // Admin flagged, waiting for customer re-approval
    return { text: "Pending Approval", colorClass: "bg-yellow-100 text-yellow-800" };
  }
  
  if (isAdminDesign) {
    // Admin uploaded design, waiting for customer approval
    return { text: "Pending Approval", colorClass: "bg-yellow-100 text-yellow-800" };
  }
  
  if (isCustomerUpload) {
    // Customer uploaded, ready to print (no approval needed)
    return { text: "Ready", colorClass: "bg-green-100 text-green-800" };
  }
  
  // If admin-created order and has artwork but no tag, it's pending customer upload
  if (isAdminCreatedOrder && !isCustomerUpload) {
    return { text: "Pending Approval", colorClass: "bg-yellow-100 text-yellow-800" };
  }
  
  // Default: has artwork, ready to print
  return { text: "Ready", colorClass: "bg-green-100 text-green-800" };
}

// Helper function to determine the order display status badge
// SIMPLE LOGIC:
// 1. Tracking number? -> "Shipped"
// 2. Admin-created order? -> "Pending" until artwork approved
// 3. Customer order with revision_requested? -> "Pending"
// 4. Everything else (customer orders) -> "Ready"
function getOrderDisplayStatus(order: Order): { text: string; colorClass: string } {
  // Priority 1: Tracking number = Shipped
  if (order.trackingNumber && order.trackingNumber.trim() !== '') {
    return { text: "Shipped", colorClass: "bg-cyan-100 text-cyan-800" };
  }
  
  const artworkStatus = order.artworkStatus || '';
  const notes = order.notes || '';
  
  // Priority 2: Admin-created orders detection
  // Use createdByAdminId if available, otherwise check notes for admin order markers
  const hasAdminMarkerInNotes = notes.includes('Payment Link:') || notes.includes('Admin-created');
  const isAdminCreated = !!order.createdByAdminId || hasAdminMarkerInNotes;
  
  if (isAdminCreated) {
    // Admin orders: Pending until artwork is approved
    if (artworkStatus === 'approved') {
      return { text: "Ready", colorClass: "bg-green-100 text-green-800" };
    }
    return { text: "Pending", colorClass: "bg-yellow-100 text-yellow-800" };
  }
  
  // Priority 3: Customer order with revision requested -> Pending
  if (artworkStatus === 'revision_requested') {
    return { text: "Pending", colorClass: "bg-yellow-100 text-yellow-800" };
  }
  
  // Priority 4: Customer orders default to Ready
  return { text: "Ready", colorClass: "bg-green-100 text-green-800" };
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

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [emailDeliveries, setEmailDeliveries] = useState<any[]>([]);
  const [emailDeliveriesLoading, setEmailDeliveriesLoading] = useState(false);
  const [emailDeliveriesError, setEmailDeliveriesError] = useState<string | null>(null);
  const [emailDeliveriesWarning, setEmailDeliveriesWarning] = useState<string | null>(null);
  const [newAdminNote, setNewAdminNote] = useState("");
  
  // Must be declared before hooks that use them
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
  const orderId = selectedOrder?.id;
  
  // Reset when closing the modal
  if (!orderId) {
    setEmailDeliveries([]);
    setEmailDeliveriesWarning(null);
    setEmailDeliveriesError(null);
    setEmailDeliveriesLoading(false);
    setNewAdminNote("");
    return;
  }
  
  let cancelled = false;
  
  async function loadEmailDeliveries() {
    try {
      setEmailDeliveriesLoading(true);
      setEmailDeliveriesError(null);
      setEmailDeliveriesWarning(null);
  
      const res = await fetch(`/api/admin/email-deliveries?orderId=${orderId}`);
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load email deliveries");
      }
  
      if (!cancelled) {
        if (data?.warning) {
          setEmailDeliveriesWarning(data.warning);
        }
        setEmailDeliveries(Array.isArray(data?.deliveries) ? data.deliveries : []);
      }
    } catch (err: any) {
      if (!cancelled) {
        setEmailDeliveriesError(err?.message || "Failed to load email deliveries");
        setEmailDeliveries([]);
      }
    } finally {
      if (!cancelled) {
        setEmailDeliveriesLoading(false);
      }
    }
  }
  
  loadEmailDeliveries();
  
  return () => {
    cancelled = true;
  };
  }, [selectedOrder?.id]);

  // Query for artwork notes - using React Query for proper cache management
  const { data: artworkNotesQuery } = useQuery<{ notes: ArtworkNote[] }>({
    queryKey: ['/api/orders', selectedOrder?.id, 'artwork-notes'],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${selectedOrder?.id}/artwork-notes`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
    enabled: !!selectedOrder?.id,
  });

  const artworkNotesFromQuery = artworkNotesQuery?.notes || [];

  // Mutation for sending notes - with proper cache invalidation
  const sendNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/orders/${selectedOrder?.id}/artwork-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send note');
      return json;
    },
    onSuccess: () => {
      setNewAdminNote("");
      toast({ 
        title: "✓ Message Sent",
        description: "Customer has been notified via email."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', selectedOrder?.id, 'artwork-notes'] });
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const [downloadFormats, setDownloadFormats] = useState<Record<number, string>>({});
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [artworkUploading, setArtworkUploading] = useState(false);
  const [artworkNotes, setArtworkNotes] = useState("");
  
  // Artwork review modal state
  const [artworkReviewModal, setArtworkReviewModal] = useState<{
    open: boolean;
    item: any;
    orderId: number;
    orderNumber: string;
    action: 'flag' | 'upload' | null;
  }>({ open: false, item: null, orderId: 0, orderNumber: '', action: null });
  const [reviewNotes, setReviewNotes] = useState("");
  const [adminUploadFile, setAdminUploadFile] = useState<File | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const handleDownload = async (url: string, itemId: number, designName: string, formatOverride?: string) => {
    const format = formatOverride || downloadFormats[itemId] || 'pdf';
    setDownloading(prev => ({ ...prev, [itemId]: true }));
    
    try {
      const downloadUrl = `/api/admin/design-download?url=${encodeURIComponent(url)}&format=${format}&filename=${encodeURIComponent(designName)}`;
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const contentType = response.headers.get('content-type') || '';
      
      // Handle PDF data (client-side PDF generation)
      if (contentType.includes('application/json') && format === 'pdf') {
        const data = await response.json();
        if (data.type === 'pdf-data') {
          // Generate PDF client-side using jspdf
          const { imageBase64, width, height, filename } = data;
          
          // Calculate PDF dimensions at 300 DPI (points = pixels * 72 / 300)
          const widthPt = width * 72 / 300;
          const heightPt = height * 72 / 300;
          
          const pdf = new jsPDF({
            orientation: width > height ? 'landscape' : 'portrait',
            unit: 'pt',
            format: [widthPt, heightPt],
          });
          
          const imgData = `data:image/png;base64,${imageBase64}`;
          pdf.addImage(imgData, 'PNG', 0, 0, widthPt, heightPt);
          pdf.save(`${filename}.pdf`);
          
          toast({ title: 'Downloaded as PDF (300 DPI)' });
          return;
        }
      }
      
      // Handle regular binary downloads
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
      const downloadFilename = filenameMatch?.[1] || `${designName.replace(/[^a-z0-9]/gi, '_')}.${format === 'original' ? 'png' : format}`;
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      
      toast({ title: format === 'original' ? 'Downloaded original file' : `Downloaded as ${format.toUpperCase()}` });
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Download failed', variant: 'destructive' });
    } finally {
      setDownloading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const { data: orderDetails } = useQuery<Order>({
    queryKey: ["/api/admin/orders", selectedOrder?.id],
    enabled: !!selectedOrder,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Order> }) => {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ 
        title: "✓ Order Updated",
        description: "Changes have been saved successfully."
      });
    },
    onError: () => toast({ title: "Failed to update order", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete order", variant: "destructive" }),
  });

  const handleDeleteOrder = (orderId: number) => {
    if (window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      deleteMutation.mutate(orderId);
    }
  };

  // Mark order as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "paid" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "✓ Order marked as paid" });
    },
    onError: (error: any) => toast({ title: error.message || "Failed to update status", variant: "destructive" }),
  });

  const handleMarkAsPaid = (orderId: number) => {
    if (window.confirm("Mark this order as PAID? This will update the payment status.")) {
      markAsPaidMutation.mutate(orderId);
    }
  };

  // Approve artwork function
  const handleApproveArtwork = async (orderId: number, orderItemId: number) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/artwork/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderItemId,
          action: "approve",
          notes: "Artwork approved for printing."
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve artwork");
      
      toast({ 
        title: "✓ Artwork Approved",
        description: "Design is now marked as ready for production."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", orderId] });
    } catch (error: any) {
      toast({ title: error.message || "Failed to approve artwork", variant: "destructive" });
    }
  };

  const resendReceiptMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await fetch(`/api/admin/orders/${orderId}/resend-receipt`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend receipt");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: data.message || "Receipt sent successfully" });
    },
    onError: (error: Error) => toast({ title: error.message || "Failed to resend receipt", variant: "destructive" }),
  });

  const updateArtworkStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, notes, designId }: { orderId: number; status: string; notes?: string; designId?: number }) => {
      const res = await fetch(`/api/admin/orders/${orderId}/artwork`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkStatus: status, artworkNotes: notes, adminDesignId: designId }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update artwork status");
      return data;
    },
    onSuccess: () => {
      toast({ title: "Artwork status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const handleArtworkUpload = async (orderId: number, file: File) => {
    setArtworkUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("notes", artworkNotes);

      const res = await fetch(`/api/admin/orders/${orderId}/artwork/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      
      toast({ 
        title: "✓ Design Sent Successfully",
        description: "Customer will receive an email to review and approve the design."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setArtworkNotes("");
    } catch (error: any) {
      toast({ title: error.message || "Failed to upload design", variant: "destructive" });
    } finally {
      setArtworkUploading(false);
    }
  };

  const [restoringArtwork, setRestoringArtwork] = useState(false);
  
  const handleRestoreOriginalArtwork = async (orderId: number) => {
    if (!confirm("Are you sure you want to restore the original customer artwork? The admin revision will be discarded.")) {
      return;
    }
    
    setRestoringArtwork(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/artwork/restore`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Restore failed");
      
      toast({ 
        title: "✓ Original Artwork Restored",
        description: "The admin design has been discarded and customer's original artwork is now active."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    } catch (error: any) {
      toast({ title: error.message || "Failed to restore original artwork", variant: "destructive" });
    } finally {
      setRestoringArtwork(false);
    }
  };

  // Handle artwork review actions (flag for revision or admin upload for approval)
  const handleArtworkReviewSubmit = async () => {
    if (!artworkReviewModal.item || !artworkReviewModal.orderId) return;
    
    setReviewSubmitting(true);
    try {
      if (artworkReviewModal.action === 'flag') {
        // Flag artwork for revision - send back to customer
        const res = await fetch(`/api/admin/orders/${artworkReviewModal.orderId}/artwork/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderItemId: artworkReviewModal.item.id,
            action: 'flag',
            notes: reviewNotes,
          }),
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to flag artwork");
        
        toast({ 
          title: "✓ Revision Request Sent",
          description: "Customer has been emailed and notified to update their design."
        });
      } else if (artworkReviewModal.action === 'upload') {
        // Admin uploads new design for customer approval
        if (!adminUploadFile) {
          toast({ title: "Please select a file to upload", variant: "destructive" });
          return;
        }
        
        const formData = new FormData();
        formData.append("file", adminUploadFile);
        formData.append("orderItemId", artworkReviewModal.item.id.toString());
        formData.append("notes", reviewNotes);
        formData.append("action", "admin_upload");
        
        const res = await fetch(`/api/admin/orders/${artworkReviewModal.orderId}/artwork/review`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to upload design");
        
        toast({ 
          title: "✓ Design Sent Successfully",
          description: "Customer has been emailed and notified to approve the design."
        });
      }
      
      // Reset modal and refetch data
      setArtworkReviewModal({ open: false, item: null, orderId: 0, orderNumber: '', action: null });
      setReviewNotes("");
      setAdminUploadFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      
    } catch (error: any) {
      toast({ title: error.message || "Failed to process artwork review", variant: "destructive" });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 text-sm md:text-base">Manage customer orders</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/admin/orders/create">
                <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-create-manual-order">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Manually create an order for phone/email customers</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Help Guide */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Quick Guide
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Order Status</span><br /><span className="text-gray-600">Green = Approved artwork</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Eye className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">View Details</span><br /><span className="text-gray-600">Eye icon shows full order info</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Truck className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Add Tracking</span><br /><span className="text-gray-600">Enter tracking # for shipments</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Palette className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Status Colors</span><br /><span className="text-gray-600">Yellow/Blue/Purple/Green by stage</span></p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => {
              const customerName = order.user?.firstName && order.user?.lastName 
                ? `${order.user.firstName} ${order.user.lastName}`.trim()
                : order.shippingAddress?.name || 'Guest Customer';
              const customerCity = order.shippingAddress?.city && order.shippingAddress?.state 
                ? `${order.shippingAddress.city}, ${order.shippingAddress.state}`
                : '';
              const itemCount = order.items?.length || 0;
              
              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all" 
                  onClick={() => setSelectedOrder(order)}
                  data-testid={`order-card-${order.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">#{order.orderNumber || order.id}</span>
                        <span className="text-lg font-semibold text-green-600">{formatPrice(order.totalAmount)}</span>
                        {/* Payment status badge */}
                        {order.status === 'paid' || order.status === 'in_production' || order.status === 'shipped' || order.status === 'delivered' ? (
                          <Badge className="bg-green-100 text-green-800">
                            Paid
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800">
                            Unpaid
                          </Badge>
                        )}
                        {/* Artwork/Production status badge */}
                        {(() => {
                          const displayStatus = getOrderDisplayStatus(order);
                          return (
                            <Badge className={displayStatus.colorClass}>
                              {displayStatus.text}
                            </Badge>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          <span className="font-medium">{customerName}</span>
                        </span>
                        {customerCity && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <MapPin className="h-3.5 w-3.5" />
                            {customerCity}
                          </span>
                        )}
                        {itemCount > 0 && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <Package className="h-3.5 w-3.5" />
                            {itemCount} item{itemCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      {/* Mark as Paid button - only show for unpaid orders */}
                      {!['paid', 'in_production', 'shipped', 'delivered'].includes(order.status) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsPaid(order.id)}
                              disabled={markAsPaidMutation.isPending}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                              data-testid={`button-mark-paid-${order.id}`}
                            >
                              Mark Paid
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Manually mark this order as paid</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={deleteMutation.isPending}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-${order.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Permanently delete this order</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500">Orders will appear here when customers place them</p>
          </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-xl font-bold">Order #{selectedOrder.orderNumber || selectedOrder.id}</h2>
                  <p className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const displayStatus = getOrderDisplayStatus(selectedOrder);
                    return (
                      <Badge className={displayStatus.colorClass}>
                        {displayStatus.text}
                      </Badge>
                    );
                  })()}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resendReceiptMutation.mutate(selectedOrder.id)}
                        disabled={resendReceiptMutation.isPending}
                        data-testid="button-resend-receipt"
                      >
                        {resendReceiptMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Resend Receipt
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Email the order receipt to the customer again</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Close order details</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Information & Addresses - All in one row */}
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Customer Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Customer
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="font-medium">
                          {orderDetails?.user?.firstName || orderDetails?.user?.lastName 
                            ? `${orderDetails?.user?.firstName || ''} ${orderDetails?.user?.lastName || ''}`.trim()
                            : selectedOrder.shippingAddress?.name || 'Guest Customer'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium break-all">
                          {orderDetails?.user?.email || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium">
                          {orderDetails?.user?.phone || selectedOrder.shippingAddress?.phone || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      Billing Address
                    </h3>
                    <div className="text-sm">
                      {(() => {
                        const addr = selectedOrder.billingAddress || selectedOrder.shippingAddress;
                        return addr && typeof addr === "object" ? (
                          <>
                            {addr.name && <p className="font-medium">{addr.name}</p>}
                            {(addr.address1 || addr.street) && <p>{addr.address1 || addr.street}</p>}
                            {addr.address2 && <p>{addr.address2}</p>}
                            <p>
                              {addr.city}, {addr.state} {addr.zip || addr.zipCode}
                            </p>
                            {addr.country && <p>{addr.country}</p>}
                          </>
                        ) : (
                          <p className="text-gray-400">Not provided</p>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Truck className="h-5 w-5 text-gray-600" />
                      Shipping Address
                    </h3>
                    <div className="text-sm">
                      {selectedOrder.shippingAddress && typeof selectedOrder.shippingAddress === "object" ? (
                        <>
                          {selectedOrder.shippingAddress.name && (
                            <p className="font-medium">{selectedOrder.shippingAddress.name}</p>
                          )}
                          {(selectedOrder.shippingAddress.address1 || selectedOrder.shippingAddress.street) && (
                            <p>{selectedOrder.shippingAddress.address1 || selectedOrder.shippingAddress.street}</p>
                          )}
                          {selectedOrder.shippingAddress.address2 && (
                            <p>{selectedOrder.shippingAddress.address2}</p>
                          )}
                          <p>
                            {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{" "}
                            {selectedOrder.shippingAddress.zip || selectedOrder.shippingAddress.zipCode}
                          </p>
                          {selectedOrder.shippingAddress.country && (
                            <p>{selectedOrder.shippingAddress.country}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-400">Not provided</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email Delivery */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Email Delivery</h3>

                  {emailDeliveriesWarning && (
                    <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                      {emailDeliveriesWarning}
                    </div>
                  )}

                  {emailDeliveriesLoading ? (
                    <p className="text-sm text-gray-600">Loading email delivery status...</p>
                  ) : emailDeliveriesError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                      {emailDeliveriesError}
                    </div>
                  ) : emailDeliveries.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      No email delivery records for this order yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">Type</th>
                            <th className="px-3 py-2 text-left font-medium">To</th>
                            <th className="px-3 py-2 text-left font-medium">Status</th>
                            <th className="px-3 py-2 text-left font-medium">Attempts</th>
                            <th className="px-3 py-2 text-left font-medium">Last Attempt</th>
                            <th className="px-3 py-2 text-left font-medium">Sent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {emailDeliveries.map((d: any) => (
                            <tr key={d.id} className="border-t border-gray-100">
                              <td className="px-3 py-2">{d.type}</td>
                              <td className="px-3 py-2">{d.toEmail}</td>
                              <td className="px-3 py-2">
                <span
                  className={
                    d.status === "sent"
                      ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                      : d.status === "failed"
                      ? "inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
                      : "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                  }
                >
                  {d.status}
                </span>
                              </td>
                              <td className="px-3 py-2">{d.attempts}</td>
                              <td className="px-3 py-2">
                {d.lastAttemptAt ? formatDate(d.lastAttemptAt) : "—"}
                              </td>
                              <td className="px-3 py-2">
                {d.sentAt ? formatDate(d.sentAt) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

{/* Order Items */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-600" />
                    Order Items ({orderDetails?.items?.length || selectedOrder.items?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {(orderDetails?.items || selectedOrder.items || []).map((item: any) => {
                      // Determine if this is an admin-created order for this item's context
                      const isAdminCreatedOrder = !!selectedOrder.createdByAdminId || 
                        !!(orderDetails as any)?.createdByAdminId ||
                        !!(selectedOrder.notes?.includes('Payment Link:')) || 
                        !!(selectedOrder.notes?.includes('Admin-created'));
                      
                      return (
                      <div key={item.id} className="bg-white rounded-lg border p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.product?.name || `Product #${item.productId}`}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>Qty: <strong>{item.quantity}</strong></span>
                              <span>Unit Price: <strong>{formatPrice(item.unitPrice)}</strong></span>
                              <span className="text-green-600 font-semibold">
                                Subtotal: {formatPrice(parseFloat(item.unitPrice) * item.quantity)}
                              </span>
                            </div>
                            {(item.resolvedOptions || item.selectedOptions) && Object.keys(item.resolvedOptions || item.selectedOptions).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Object.entries(item.resolvedOptions || item.selectedOptions).map(([key, value]) => (
                                  <Badge key={key} variant="outline" className="text-xs capitalize">
                                    {key}: {String(value)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Design/Artwork Section */}
                        <div className="mt-3 pt-3 border-t">
                          {(() => {
                            const badgeInfo = getArtworkBadgeInfo(item.design, isAdminCreatedOrder);
                            return (
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                  <Palette className="h-4 w-4 text-orange-500" />
                                  Artwork
                                </p>
                                <div className="flex items-center gap-2">
                                  {item.product?.name?.toLowerCase().includes('die') || item.product?.name?.toLowerCase().includes('kiss') ? (
                                    <Badge className="text-xs bg-purple-100 text-purple-700">
                                      Die-Cut
                                    </Badge>
                                  ) : null}
                                  <Badge className={`text-xs ${badgeInfo.colorClass}`} data-testid={`badge-artwork-status-${item.id}`}>
                                    {badgeInfo.text}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })()}
                          
                        {/* Artwork display - always show full layout */}
                        <p className="text-xs text-gray-500 mb-2">
                          {item.design 
                            ? (item.design.name || 'Untitled').replace(/\[(ADMIN_DESIGN|CUSTOMER_UPLOAD|FLAGGED|APPROVED)\]/g, '').trim()
                            : 'Uploaded Artwork'
                          }
                        </p>
                        <div className="flex flex-wrap items-start gap-4">
                          {/* Design Preview - Click to open modal */}
                          {(() => {
                            const hasDesign = item.design && (item.design.highResExportUrl || item.design.previewUrl);
                            const previewUrl = item.design?.previewUrl || item.design?.highResExportUrl;
                            const isPdf = previewUrl?.toLowerCase().includes('.pdf');
                            
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
                                  <FileText className="h-10 w-10 text-red-500" />
                                  <span className="text-xs text-red-600 mt-1 font-medium">PDF File</span>
                                </div>
                              );
                            }
                            
                            return (
                              <div 
                                className="relative cursor-pointer group"
                                onClick={() => setPreviewImage({
                                  url: `/api/admin/design-download?url=${encodeURIComponent(item.design.highResExportUrl || item.design.previewUrl)}&format=preview`,
                                  name: item.design.name || 'Design Preview'
                                })}
                              >
                                <img 
                                  src={`/api/admin/design-download?url=${encodeURIComponent(previewUrl)}&format=preview`}
                                  alt="Design preview" 
                                  className="w-24 h-24 object-contain bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] rounded-lg border-2 border-gray-200"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <ZoomIn className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            );
                          })()}
                          
                          {/* Download with Format Selection */}
                          <div className="flex flex-col gap-2">
                            {/* Format selector and download - always show */}
                            {(() => {
                              const hasDesign = item.design && (item.design.highResExportUrl || item.design.previewUrl);
                              const url = item.design?.highResExportUrl || item.design?.previewUrl || '';
                              const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
                              const isSpecialFormat = hasDesign && ['eps', 'cdr', 'ai', 'psd'].includes(ext);
                              const isSpecialOrPdf = hasDesign && ['eps', 'cdr', 'ai', 'psd', 'pdf'].includes(ext);
                              
                              return (
                                <>
                                  {isSpecialFormat && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-1">
                                      <p className="text-xs text-amber-700 font-medium">
                                        {ext.toUpperCase()} files can only be downloaded in their original format (no conversion available)
                                      </p>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    {(!isSpecialOrPdf || !hasDesign) && (
                                      <Select
                                        value={downloadFormats[item.id] || 'pdf'}
                                        onValueChange={(value) => setDownloadFormats(prev => ({ ...prev, [item.id]: value }))}
                                        disabled={!hasDesign}
                                      >
                                        <SelectTrigger className="w-28" data-testid={`select-format-${item.id}`}>
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
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          onClick={() => {
                                            if (!hasDesign) return;
                                            handleDownload(
                                              url,
                                              item.id,
                                              item.design?.name || 'design',
                                              isSpecialOrPdf ? 'original' : undefined
                                            );
                                          }}
                                          disabled={downloading[item.id] || !hasDesign}
                                          className="bg-orange-500 hover:bg-orange-600"
                                          data-testid={`button-download-${item.id}`}
                                        >
                                          {downloading[item.id] ? (
                                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                          ) : (
                                            <Download className="h-4 w-4 mr-2" />
                                          )}
                                          {isSpecialOrPdf && hasDesign ? `Download ${ext.toUpperCase()}` : 'Download'}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p>{hasDesign ? 'Download print-ready artwork at 300 DPI in your selected format' : 'No artwork uploaded yet'}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <div className="text-xs text-gray-500 space-y-1">
                                    <p>PNG/TIFF preserve transparency</p>
                                    <p className="text-amber-600">EPS, CDR, AI, PSD, PDF files download as-is (no conversion available)</p>
                                  </div>
                                </>
                              );
                            })()}
                            
                            {item.design?.customShapeUrl && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleDownload(
                                      item.design.customShapeUrl,
                                      item.id + 1000,
                                      `${item.design.name || 'design'}_diecut`,
                                      'original'
                                    )}
                                    disabled={downloading[item.id + 1000]}
                                    className="text-blue-700 border-blue-300"
                                  >
                                    <FileImage className="h-4 w-4 mr-2" />
                                    Download Die-Cut Shape
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Download the custom die-cut outline for this sticker design</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {item.printFileUrl && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleDownload(
                                      item.printFileUrl,
                                      item.id + 2000,
                                      `${item.design?.name || 'design'}_production`,
                                      'original'
                                    )}
                                    disabled={downloading[item.id + 2000]}
                                    className="text-green-700 border-green-300"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Production File
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Download the final production-ready file for printing</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            
                            {/* Admin Artwork Review Actions - always show */}
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                              {/* Approve button - show when:
                                 - Admin-created order: always show if artwork exists and not approved
                                 - Customer-created order: only show if artwork was flagged for revision by admin */}
                              {item.design && (item.design.previewUrl || item.design.highResExportUrl || item.design.artworkUrl) && 
                               !item.design?.name?.includes('[APPROVED]') && 
                               (isAdminCreatedOrder || item.design?.name?.includes('[FLAGGED]')) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-700 border-green-300 hover:bg-green-50"
                                      onClick={() => handleApproveArtwork(selectedOrder.id, item.id)}
                                      data-testid={`button-approve-artwork-${item.id}`}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Approve Artwork
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-xs">
                                    <p>Approve this artwork for printing. The order will be marked as ready.</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-amber-700 border-amber-300 hover:bg-amber-50"
                                    onClick={() => setArtworkReviewModal({
                                      open: true,
                                      item,
                                      orderId: selectedOrder.id,
                                      orderNumber: selectedOrder.orderNumber || `#${selectedOrder.id}`,
                                      action: 'flag'
                                    })}
                                    data-testid={`button-flag-revision-${item.id}`}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Request Revision
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs">
                                  <p>Flag this artwork and ask the customer to upload a corrected version. Add notes explaining what needs to be changed.</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-700 border-blue-300 hover:bg-blue-50"
                                    onClick={() => setArtworkReviewModal({
                                      open: true,
                                      item,
                                      orderId: selectedOrder.id,
                                      orderNumber: selectedOrder.orderNumber || `#${selectedOrder.id}`,
                                      action: 'upload'
                                    })}
                                    data-testid={`button-admin-upload-${item.id}`}
                                  >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Upload New Design
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs">
                                  <p>Upload a corrected or new design for this customer. They will need to approve it before printing.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                        </div>
                      </div>
                    );
                    })}
                    {(!orderDetails?.items?.length && !selectedOrder.items?.length) && (
                      <div className="text-center py-4 text-gray-500">
                        No items found for this order
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary & Shipping/Tracking - Side by Side */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Financial Summary */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Financial Summary
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatPrice(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">{formatPrice(selectedOrder.shippingCost || '0')}</span>
                      </div>
                      {parseFloat(selectedOrder.taxAmount || '0') > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax</span>
                          <span className="font-medium">{formatPrice(selectedOrder.taxAmount || '0')}</span>
                        </div>
                      )}
                      {parseFloat(selectedOrder.discountAmount || '0') > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span className="font-medium">-{formatPrice(selectedOrder.discountAmount || '0')}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-green-200 text-lg font-bold">
                        <span>Total</span>
                        <span className="text-green-700">{formatPrice(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tracking & Shipping */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Truck className="h-5 w-5 text-indigo-600" />
                      Shipping & Tracking
                    </h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Tracking Number</label>
                        <input
                          type="text"
                          value={selectedOrder.trackingNumber || ""}
                          onChange={(e) =>
                            setSelectedOrder({ ...selectedOrder, trackingNumber: e.target.value })
                          }
                          placeholder="Enter tracking number"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      <Button
                        onClick={() =>
                          updateMutation.mutate({
                            id: selectedOrder.id,
                            data: { trackingNumber: selectedOrder.trackingNumber },
                          })
                        }
                        className="w-full"
                      >
                        Save Tracking
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Customer Communication */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Customer Communication
                    {artworkNotesFromQuery.length > 0 && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">{artworkNotesFromQuery.length}</Badge>
                    )}
                  </h3>
                  
                  {/* Message History */}
                  {artworkNotesFromQuery.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                      {artworkNotesFromQuery.map((note) => (
                        <div 
                          key={note.id} 
                          className={`p-2 rounded-lg text-sm ${
                            note.senderType === 'admin' 
                              ? 'bg-blue-100 ml-4' 
                              : 'bg-white mr-4 border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600">
                              {note.senderType === 'admin' ? 'You' : 'Customer'}
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
                          <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-3">No messages yet.</p>
                  )}
                  
                  {/* Send Message */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAdminNote}
                      onChange={(e) => setNewAdminNote(e.target.value)}
                      placeholder="Send a message to the customer..."
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      data-testid="input-admin-note"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newAdminNote.trim()) {
                          sendNoteMutation.mutate(newAdminNote.trim());
                        }
                      }}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => sendNoteMutation.mutate(newAdminNote.trim())}
                          disabled={sendNoteMutation.isPending || !newAdminNote.trim()}
                          data-testid="button-send-admin-note"
                        >
                          {sendNoteMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Send message to customer via email</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Order Notes */}
                {selectedOrder.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Order Notes</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {selectedOrder.notes
                        .replace(/Payment Link:\s*[a-f0-9-]+/gi, '')
                        .replace(/\n\s*\n/g, '\n')
                        .trim()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Artwork Review Modal */}
      <Dialog 
        open={artworkReviewModal.open} 
        onOpenChange={(open) => {
          if (!open) {
            setArtworkReviewModal({ open: false, item: null, orderId: 0, orderNumber: '', action: null });
            setReviewNotes("");
            setAdminUploadFile(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {artworkReviewModal.action === 'flag' ? (
                <>
                  <RefreshCw className="h-5 w-5 text-amber-500" />
                  Request Artwork Revision
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-blue-500" />
                  Upload Design for Customer
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <strong>Order:</strong> {artworkReviewModal.orderNumber}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Product:</strong> {artworkReviewModal.item?.product?.name || `Product #${artworkReviewModal.item?.productId}`}
              </p>
            </div>

            {artworkReviewModal.action === 'flag' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  This will flag the current artwork for revision and notify the customer to update their design.
                </p>
              </div>
            )}

            {artworkReviewModal.action === 'upload' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload New Design
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.eps,.ai,.psd,.cdr,.svg"
                    onChange={(e) => setAdminUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-sm border rounded-lg p-2"
                    data-testid="input-admin-design-file"
                  />
                  {adminUploadFile && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {adminUploadFile.name}
                    </p>
                  )}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    This design will be sent to the customer for their approval before printing.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {artworkReviewModal.action === 'flag' ? 'Reason for Revision' : 'Notes for Customer'}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={artworkReviewModal.action === 'flag' 
                  ? "Explain what needs to be changed (e.g., resolution too low, colors outside printable range, text too close to edge...)"
                  : "Add any notes about this design (e.g., I've adjusted the colors for better print quality...)"
                }
                className="w-full border rounded-lg p-3 text-sm"
                rows={4}
                data-testid="input-review-notes"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setArtworkReviewModal({ open: false, item: null, orderId: 0, orderNumber: '', action: null });
                  setReviewNotes("");
                  setAdminUploadFile(null);
                }}
                data-testid="button-cancel-review"
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 ${artworkReviewModal.action === 'flag' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                onClick={handleArtworkReviewSubmit}
                disabled={reviewSubmitting || (artworkReviewModal.action === 'upload' && !adminUploadFile)}
                data-testid="button-submit-review"
              >
                {reviewSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {artworkReviewModal.action === 'flag' ? 'Send Revision Request' : 'Send to Customer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{previewImage?.name || 'Design Preview'}</DialogTitle>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#ffffff_0%_50%)] bg-[length:20px_20px]">
            {previewImage && (
              <img 
                src={previewImage.url} 
                alt={previewImage.name} 
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}