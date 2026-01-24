"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Palette, 
  Check, 
  X, 
  ArrowLeft, 
  FileImage, 
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageSquare
} from "lucide-react";
import Link from "next/link";

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: string;
  product?: {
    name: string;
    imageUrl?: string;
  };
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  artworkStatus: string;
  customerArtworkUrl?: string;
  adminDesignId?: number;
  artworkNotes?: string;
  totalAmount: string;
  items: OrderItem[];
  adminDesign?: {
    id: number;
    name: string;
    thumbnailUrl?: string;
    canvasDataUrl?: string;
  };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

function getArtworkStatusInfo(status: string) {
  switch (status) {
    case 'awaiting_artwork':
      return { label: 'Awaiting Artwork', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    case 'customer_designing':
      return { label: 'Designing', color: 'bg-blue-100 text-blue-800', icon: Palette };
    case 'artwork_uploaded':
      return { label: 'Artwork Uploaded', color: 'bg-purple-100 text-purple-800', icon: FileImage };
    case 'admin_designing':
      return { label: 'Design In Progress', color: 'bg-indigo-100 text-indigo-800', icon: Palette };
    case 'pending_approval':
      return { label: 'Pending Your Approval', color: 'bg-orange-100 text-orange-800', icon: AlertCircle };
    case 'revision_requested':
      return { label: 'Revision Requested', color: 'bg-red-100 text-red-800', icon: MessageSquare };
    case 'approved':
      return { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle2 };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800', icon: Clock };
  }
}

export default function ArtworkClient() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orderId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ['/api/orders', orderId, 'artwork'],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/artwork`);
      if (!res.ok) throw new Error('Failed to fetch order');
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`/api/orders/${orderId}/artwork/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Upload failed');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Artwork uploaded successfully", description: "Our team will review your artwork and get back to you." });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId, 'artwork'] });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/artwork/approve`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to approve');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Design approved!", description: "Your order will now proceed to production." });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId, 'artwork'] });
    },
    onError: () => {
      toast({ title: "Failed to approve", variant: "destructive" });
    },
  });

  const revisionMutation = useMutation({
    mutationFn: async (notes: string) => {
      const res = await fetch(`/api/orders/${orderId}/artwork/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error('Failed to request revision');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Revision requested", description: "We'll work on the changes and get back to you." });
      setShowRevisionForm(false);
      setRevisionNotes("");
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId, 'artwork'] });
    },
    onError: () => {
      toast({ title: "Failed to request revision", variant: "destructive" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/postscript',
      'image/vnd.adobe.photoshop', 'application/x-photoshop',
      'application/illustrator', 'application/eps',
      'application/x-coreldraw'
    ];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.eps', '.ai', '.psd', '.cdr'];
    
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      toast({ 
        title: "Invalid file type", 
        description: "Please upload an image (JPG, PNG, GIF, WebP) or professional file (PDF, EPS, AI, PSD, CDR)",
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDesignClick = () => {
    router.push(`/editor/new?orderId=${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Order Not Found</h2>
              <p className="text-gray-600 mb-4">We couldn't find this order or you don't have access to it.</p>
              <Link href="/account">
                <Button data-testid="button-back-account">Back to Account</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusInfo = getArtworkStatusInfo(order.artworkStatus);
  const StatusIcon = statusInfo.icon;
  const showApprovalActions = order.artworkStatus === 'pending_approval';
  const canUploadOrDesign = ['awaiting_artwork', 'revision_requested'].includes(order.artworkStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/account">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Order Artwork</h1>
            <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">Artwork Status</CardTitle>
              <Badge className={statusInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {order.artworkStatus === 'awaiting_artwork' && (
              <p className="text-sm text-gray-600">
                Please upload your artwork or use our design editor to create your design.
              </p>
            )}
            {order.artworkStatus === 'artwork_uploaded' && (
              <p className="text-sm text-gray-600">
                We've received your artwork and our team is reviewing it. We'll create a print-ready design for your approval.
              </p>
            )}
            {order.artworkStatus === 'admin_designing' && (
              <p className="text-sm text-gray-600">
                Our team is working on your design. You'll receive a notification when it's ready for review.
              </p>
            )}
            {order.artworkStatus === 'pending_approval' && (
              <p className="text-sm text-gray-600">
                Your design is ready! Please review it below and approve or request changes.
              </p>
            )}
            {order.artworkStatus === 'revision_requested' && (
              <p className="text-sm text-gray-600">
                We're working on the changes you requested. You can also upload new artwork if needed.
              </p>
            )}
            {order.artworkStatus === 'approved' && (
              <p className="text-sm text-green-600">
                Your design has been approved and your order is being processed.
              </p>
            )}
          </CardContent>
        </Card>

        {order.items.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  {item.product?.imageUrl ? (
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <FileImage className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product?.name || 'Product'}</p>
                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-sm">{formatPrice(parseFloat(item.unitPrice) * item.quantity)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {order.customerArtworkUrl && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Uploaded Artwork</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-3">
                <FileImage className="h-8 w-8 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Uploaded File</p>
                  <a 
                    href={order.customerArtworkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-orange-600 hover:underline"
                    data-testid="link-view-artwork"
                  >
                    View File
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {order.adminDesign && showApprovalActions && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Design for Approval</CardTitle>
              <CardDescription>Review your design and approve or request changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.adminDesign.thumbnailUrl && (
                <div className="bg-white rounded-lg p-2 border">
                  <img 
                    src={order.adminDesign.thumbnailUrl} 
                    alt="Design preview"
                    className="w-full max-h-64 object-contain rounded"
                    data-testid="img-design-preview"
                  />
                </div>
              )}
              
              {order.artworkNotes && (
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-xs text-gray-500 mb-1">Notes from our team:</p>
                  <p className="text-sm">{order.artworkNotes}</p>
                </div>
              )}

              {!showRevisionForm ? (
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                    data-testid="button-approve-design"
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Approve Design
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowRevisionForm(true)}
                    data-testid="button-request-revision"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Request Changes
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Describe the changes you'd like..."
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    rows={3}
                    data-testid="input-revision-notes"
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => revisionMutation.mutate(revisionNotes)}
                      disabled={!revisionNotes.trim() || revisionMutation.isPending}
                      data-testid="button-submit-revision"
                    >
                      {revisionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Submit Revision Request
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowRevisionForm(false);
                        setRevisionNotes("");
                      }}
                      data-testid="button-cancel-revision"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {canUploadOrDesign && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Submit Your Artwork</CardTitle>
              <CardDescription>Choose how you'd like to provide your design</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.eps,.ai,.psd,.cdr"
                className="hidden"
                data-testid="input-file-upload"
              />
              
              <Button
                variant="outline"
                className="w-full h-20 border-dashed border-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                data-testid="button-upload-artwork"
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                ) : (
                  <Upload className="h-6 w-6 mr-2" />
                )}
                <div className="text-left">
                  <p className="font-medium">Upload Artwork</p>
                  <p className="text-xs text-gray-500">JPG, PNG, PDF, EPS, AI, PSD, CDR</p>
                </div>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">or</span>
                </div>
              </div>

              <Button
                className="w-full h-20 bg-orange-500 hover:bg-orange-600"
                onClick={handleDesignClick}
                data-testid="button-design-editor"
              >
                <Palette className="h-6 w-6 mr-2" />
                <div className="text-left">
                  <p className="font-medium">Use Design Editor</p>
                  <p className="text-xs opacity-90">Create your design from scratch</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        )}

        {order.artworkStatus === 'approved' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">Design Approved!</h3>
              <p className="text-sm text-gray-600">Your order is now in production.</p>
            </CardContent>
          </Card>
        )}

        <div className="text-center pb-6">
          <Link href="/account">
            <Button variant="link" data-testid="button-back-to-account">
              Back to Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
