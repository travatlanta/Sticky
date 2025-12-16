"use client";


import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Package,
  Upload,
  Image,
  Layout,
  FileImage,
  Edit2,
  CheckCircle,
  Layers,
  Truck,
  Flame,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DealsTab from "@/components/admin/DealsTab";

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  basePrice: string;
  thumbnailUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: number | null;

  // Print dimensions for editor canvas
  printWidthInches?: string;
  printHeightInches?: string;
  printDpi?: number;
  bleedSize?: string;
  safeZoneSize?: string;

  // Per-product shipping settings.  These are returned from the API and
  // optionally edited in the admin form.  shippingType can be 'free',
  // 'flat', or 'calculated'.  flatShippingPrice should be a string
  // representing a decimal or null when not used.
  shippingType?: string;
  flatShippingPrice?: string | null;
}

interface ProductTemplate {
  id: number;
  productId: number;
  name: string;
  description: string | null;
  previewImageUrl: string | null;
  canvasJson: any;
  isActive: boolean;
  displayOrder: number;
}

export default function AdminProducts() {
  const [activeTab, setActiveTab] = useState("products");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    basePrice: "",
    isActive: true,
    isFeatured: false,
    thumbnailUrl: "",
    shippingType: "calculated" as string,
    flatShippingPrice: "" as string | null,
    // Print dimensions
    printWidthInches: "4",
    printHeightInches: "4",
    printDpi: 300,
    bleedSize: "0.125",
    safeZoneSize: "0.125",
  });
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCreate, setIsUploadingCreate] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateFileInputRef = useRef<HTMLInputElement>(null);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    previewImageUrl: "",
    canvasJson: "",
    isActive: true,
  });
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadProductImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/upload/product-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Failed to upload image", variant: "destructive" });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    
    const imageUrl = await uploadProductImage(file);
    if (imageUrl) {
      setEditingProduct({ ...editingProduct, thumbnailUrl: imageUrl });
    }
  };

  const handleCreateImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingCreate(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      const response = await fetch('/api/admin/upload/product-image', {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setFormData({ ...formData, thumbnailUrl: data.url });
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploadingCreate(false);
    }
  };

  const uploadTemplateImage = async (file: File): Promise<string | null> => {
    setIsUploadingTemplate(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/upload/template-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading template image:', error);
      toast({ title: "Failed to upload template image", variant: "destructive" });
      return null;
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  const handleTemplateImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const imageUrl = await uploadTemplateImage(file);
    if (imageUrl) {
      setTemplateForm({ ...templateForm, previewImageUrl: imageUrl });
    }
  };

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<ProductTemplate[]>({
    queryKey: ["/api/admin/products", editingProduct?.id, "templates"],
    enabled: !!editingProduct,
    queryFn: async () => {
      if (!editingProduct) return [];
      const res = await fetch(`/api/admin/products/${editingProduct.id}/templates`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setShowCreateForm(false);
      // Reset form data including shipping and print dimension fields
      setFormData({
        name: "",
        slug: "",
        description: "",
        basePrice: "",
        isActive: true,
        isFeatured: false,
        thumbnailUrl: "",
        shippingType: "calculated",
        flatShippingPrice: "",
        printWidthInches: "4",
        printHeightInches: "4",
        printDpi: 300,
        bleedSize: "0.125",
        safeZoneSize: "0.125",
      });
      toast({ title: "Product created successfully" });
    },
    onError: () => toast({ title: "Failed to create product", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setEditingProduct(null);
      toast({ title: "Product updated successfully" });
    },
    onError: () => toast({ title: "Failed to update product", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete product", variant: "destructive" }),
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof templateForm) => {
      if (!editingProduct) throw new Error("No product selected");
      const res = await fetch(`/api/admin/products/${editingProduct.id}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          canvasJson: data.canvasJson ? JSON.parse(data.canvasJson) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products", editingProduct?.id, "templates"] });
      setShowAddTemplate(false);
      setTemplateForm({ name: "", description: "", previewImageUrl: "", canvasJson: "", isActive: true });
      toast({ title: "Template created successfully" });
    },
    onError: () => toast({ title: "Failed to create template", variant: "destructive" }),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products", editingProduct?.id, "templates"] });
      toast({ title: "Template deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete template", variant: "destructive" }),
  });

  const resetTemplateForm = () => {
    setTemplateForm({ name: "", description: "", previewImageUrl: "", canvasJson: "", isActive: true });
    setShowAddTemplate(false);
  };

  const handleCloseEditModal = () => {
    setEditingProduct(null);
    resetTemplateForm();
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name) {
      toast({ title: "Template name is required", variant: "destructive" });
      return;
    }
    if (templateForm.canvasJson) {
      try {
        JSON.parse(templateForm.canvasJson);
      } catch {
        toast({ title: "Invalid canvas JSON format", variant: "destructive" });
        return;
      }
    }
    createTemplateMutation.mutate(templateForm);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const toggleActive = (product: Product) => {
    updateMutation.mutate({ id: product.id, data: { isActive: !product.isActive } });
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Products & Deals</h1>
          <p className="text-gray-600 text-sm md:text-base">Manage your product catalog and promotional deals</p>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={(v) => {
            setActiveTab(v);
            if (v === "deals") {
              setShowCreateForm(false);
              setEditingProduct(null);
            }
          }} 
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="gap-2" data-testid="tab-products">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="deals" className="gap-2" data-testid="tab-deals">
              <Flame className="h-4 w-4" />
              Hot Deals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Product Catalog</h2>
                <p className="text-gray-600 text-sm">Manage your products</p>
              </div>
              <Button onClick={() => setShowCreateForm(!showCreateForm)} className="w-full sm:w-auto" data-testid="button-add-product">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            {/* Help Guide */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base">
            <Package className="h-5 w-5 text-orange-600" />
            Quick Guide
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Plus className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Add Products</span><br /><span className="text-gray-600">Click "Add Product" to create new items</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Edit2 className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Edit Details</span><br /><span className="text-gray-600">Pencil icon to update info & images</span></p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Toggle Status</span><br /><span className="text-gray-600">Activate or deactivate from store</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Layers className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Templates</span><br /><span className="text-gray-600">Add pre-made designs for customers</span></p>
            </div>
            {/* Shipping Settings */}
            <div className="flex items-start gap-2">
              <Truck className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                <span className="font-semibold text-gray-800">Shipping Settings</span>
                <br />
                <a href="/admin/shipping" className="text-gray-600 underline hover:text-orange-600">
                  Adjust shipping options
                </a>
              </p>
            </div>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm mb-6">
            <h2 className="text-base md:text-lg font-semibold mb-4">Create New Product</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Product Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Product Image</label>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                    {formData.thumbnailUrl ? (
                      <img 
                        src={formData.thumbnailUrl} 
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={createFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleCreateImageChange}
                      className="hidden"
                      data-testid="input-create-product-image"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => createFileInputRef.current?.click()}
                      disabled={isUploadingCreate}
                      className="w-full"
                      data-testid="button-upload-create-image"
                    >
                      {isUploadingCreate ? (
                        "Uploading..."
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {formData.thumbnailUrl ? "Change Image" : "Upload Image"}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF, or WebP. Max 10MB.</p>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                    data-testid="input-product-name"
                  />
                </div>
                <div>
                  {/* Label for the URL path input. Avoid using the term "slug" so it's clear to administrators. */}
                  <label className="block text-sm font-medium mb-1">URL Path</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="e.g., custom-sticker-pack"
                    required
                    data-testid="input-product-slug"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use lowercase letters, numbers, or hyphens; avoid using only numbers. This value becomes part of the product URL.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Base Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                    data-testid="input-product-price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    data-testid="input-product-description"
                  />
                </div>
                {/* Shipping type selector */}
                <div>
                  <label className="block text-sm font-medium mb-1">Shipping Type</label>
                  <select
                    value={formData.shippingType}
                    onChange={(e) => setFormData({ ...formData, shippingType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    data-testid="select-shipping-type"
                  >
                    <option value="calculated">Calculated</option>
                    <option value="flat">Flat Rate</option>
                    <option value="free">Free</option>
                  </select>
                </div>
                {/* Flat shipping price input shown only when shippingType is 'flat' */}
                {formData.shippingType === 'flat' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Flat Shipping Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.flatShippingPrice ?? ''}
                      onChange={(e) => setFormData({ ...formData, flatShippingPrice: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      data-testid="input-flat-shipping-price"
                    />
                  </div>
                )}
              </div>
              
              {/* Print Dimensions Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Print Dimensions (for Design Editor)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Width (inches)</label>
                    <input
                      type="number"
                      step="0.125"
                      min="0.5"
                      max="48"
                      value={formData.printWidthInches}
                      onChange={(e) => setFormData({ ...formData, printWidthInches: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      data-testid="input-print-width"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Height (inches)</label>
                    <input
                      type="number"
                      step="0.125"
                      min="0.5"
                      max="48"
                      value={formData.printHeightInches}
                      onChange={(e) => setFormData({ ...formData, printHeightInches: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      data-testid="input-print-height"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">DPI</label>
                    <select
                      value={formData.printDpi}
                      onChange={(e) => setFormData({ ...formData, printDpi: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      data-testid="select-print-dpi"
                    >
                      <option value={150}>150 (Web)</option>
                      <option value={300}>300 (Print)</option>
                      <option value={600}>600 (High Res)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Bleed (inches)</label>
                    <input
                      type="number"
                      step="0.0625"
                      min="0"
                      max="1"
                      value={formData.bleedSize}
                      onChange={(e) => setFormData({ ...formData, bleedSize: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      data-testid="input-bleed-size"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Safe Zone (inches)</label>
                    <input
                      type="number"
                      step="0.0625"
                      min="0"
                      max="1"
                      value={formData.safeZoneSize}
                      onChange={(e) => setFormData({ ...formData, safeZoneSize: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      data-testid="input-safe-zone"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Canvas size: {Math.round(parseFloat(formData.printWidthInches) * formData.printDpi)} x {Math.round(parseFloat(formData.printHeightInches) * formData.printDpi)} pixels
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  <span>Featured</span>
                </label>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-product">
                  {createMutation.isPending ? "Creating..." : "Create Product"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm" data-testid={`product-card-${product.id}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Product Image Thumbnail */}
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                    {product.thumbnailUrl ? (
                      <img 
                        src={product.thumbnailUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium text-gray-900 text-sm md:text-base truncate">{product.name}</p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                      {product.isFeatured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="font-medium text-gray-900">{formatPrice(product.basePrice)}</span>
                      <span className="truncate">{product.slug}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleActive(product)}
                      data-testid={`button-toggle-${product.id}`}
                    >
                      {product.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingProduct(product)}
                      data-testid={`button-edit-${product.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this product?")) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
                      data-testid={`button-delete-${product.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first product</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        )}

        {editingProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Edit Product: {editingProduct.name}</h2>
                <Button size="icon" variant="ghost" onClick={handleCloseEditModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="details" data-testid="tab-product-details">
                    <FileImage className="h-4 w-4 mr-2" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="templates" data-testid="tab-product-templates">
                    <Layout className="h-4 w-4 mr-2" />
                    Templates ({templates?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateMutation.mutate({
                        id: editingProduct.id,
                        data: editingProduct,
                      });
                    }}
                    className="space-y-4"
                  >
                    {/* Product Image Section */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Product Image</label>
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                          {editingProduct.thumbnailUrl ? (
                            <img 
                              src={editingProduct.thumbnailUrl} 
                              alt={editingProduct.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                            data-testid="input-product-image"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full"
                            data-testid="button-upload-image"
                          >
                            {isUploading ? (
                              "Uploading..."
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                {editingProduct.thumbnailUrl ? "Change Image" : "Upload Image"}
                              </>
                            )}
                          </Button>
                          {editingProduct.thumbnailUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingProduct({ ...editingProduct, thumbnailUrl: null })}
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid="button-remove-image"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove Image
                            </Button>
                          )}
                          <p className="text-xs text-gray-500">JPG, PNG, GIF, or WebP. Max 10MB.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        data-testid="input-edit-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Base Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingProduct.basePrice}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, basePrice: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        data-testid="input-edit-price"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={editingProduct.description || ""}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, description: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                        data-testid="input-edit-description"
                      />
                    </div>
                {/* Shipping type selector for editing existing products */}
                <div>
                  <label className="block text-sm font-medium mb-1">Shipping Type</label>
                  <select
                    value={editingProduct.shippingType || 'calculated'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, shippingType: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    data-testid="select-edit-shipping-type"
                  >
                    <option value="calculated">Calculated</option>
                    <option value="flat">Flat Rate</option>
                    <option value="free">Free</option>
                  </select>
                </div>
                {/* Flat shipping price input shown only when editingProduct.shippingType is 'flat' */}
                {editingProduct.shippingType === 'flat' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Flat Shipping Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.flatShippingPrice ?? ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, flatShippingPrice: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      data-testid="input-edit-flat-shipping-price"
                    />
                  </div>
                )}
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editingProduct.isActive}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, isActive: e.target.checked })
                          }
                          data-testid="checkbox-edit-active"
                        />
                        <span>Active</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editingProduct.isFeatured}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })
                          }
                          data-testid="checkbox-edit-featured"
                        />
                        <span>Featured</span>
                      </label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={handleCloseEditModal} data-testid="button-cancel-edit">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateMutation.isPending || isUploading} data-testid="button-save-changes">
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="templates">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        Pre-designed templates customers can use when designing this product.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setShowAddTemplate(!showAddTemplate)}
                        data-testid="button-add-template"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Template
                      </Button>
                    </div>

                    {showAddTemplate && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <h4 className="font-medium text-sm">New Template</h4>
                        <form onSubmit={handleCreateTemplate} className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Name *</label>
                            <input
                              type="text"
                              value={templateForm.name}
                              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              placeholder="e.g., Business Card Basic"
                              data-testid="input-template-name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <input
                              type="text"
                              value={templateForm.description}
                              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              placeholder="Brief description of this template"
                              data-testid="input-template-description"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Preview Image</label>
                            <div className="flex items-center gap-3">
                              {templateForm.previewImageUrl ? (
                                <img src={templateForm.previewImageUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border" />
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <Image className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <input
                                ref={templateFileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleTemplateImageChange}
                                className="hidden"
                                data-testid="input-template-image"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => templateFileInputRef.current?.click()}
                                disabled={isUploadingTemplate}
                              >
                                {isUploadingTemplate ? "Uploading..." : "Upload Image"}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Canvas JSON (optional)</label>
                            <textarea
                              value={templateForm.canvasJson}
                              onChange={(e) => setTemplateForm({ ...templateForm, canvasJson: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                              rows={3}
                              placeholder='{"objects":[],"version":"5.3.0"}'
                              data-testid="input-template-json"
                            />
                            <p className="text-xs text-gray-500 mt-1">Fabric.js canvas JSON export</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={templateForm.isActive}
                              onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                              id="template-active"
                            />
                            <label htmlFor="template-active" className="text-sm">Active (visible to customers)</label>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={resetTemplateForm}>
                              Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={createTemplateMutation.isPending} data-testid="button-save-template">
                              {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {templatesLoading ? (
                      <div className="py-8 text-center text-gray-500">Loading templates...</div>
                    ) : templates && templates.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {templates.map((template) => (
                          <div
                            key={template.id}
                            className={`relative rounded-lg border p-3 ${template.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                            data-testid={`template-card-${template.id}`}
                          >
                            <div className="aspect-square rounded-lg bg-gray-100 mb-2 flex items-center justify-center overflow-hidden">
                              {template.previewImageUrl ? (
                                <img src={template.previewImageUrl} alt={template.name} className="w-full h-full object-cover" />
                              ) : (
                                <Layout className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                            <p className="font-medium text-sm truncate">{template.name}</p>
                            {template.description && (
                              <p className="text-xs text-gray-500 truncate">{template.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}> 
                                {template.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm("Delete this template?")) {
                                    deleteTemplateMutation.mutate(template.id);
                                  }
                                }}
                                data-testid={`button-delete-template-${template.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500 border-2 border-dashed rounded-lg">
                        <Layout className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No templates yet</p>
                        <p className="text-xs text-gray-400">Add templates for customers to use in the editor</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
          </TabsContent>

          <TabsContent value="deals">
            {activeTab === "deals" && <DealsTab />}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}