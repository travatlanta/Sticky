export const dynamic = "force-dynamic";
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Plus, Pencil, Trash2, Flame, Eye, EyeOff, Home, ArrowUp, ArrowDown, Upload, Star, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Deal {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  originalPrice: string | null;
  dealPrice: string;
  quantity: number | null;
  productSize: string | null;
  productType: string | null;
  linkUrl: string | null;
  badgeText: string | null;
  badgeColor: string | null;
  ctaText: string | null;
  displayOrder: number;
  isActive: boolean;
  showOnHomepage: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

const defaultFormData = {
  title: "",
  description: "",
  imageUrl: "",
  originalPrice: "",
  dealPrice: "",
  quantity: "",
  productSize: "",
  productType: "",
  linkUrl: "",
  badgeText: "",
  badgeColor: "yellow",
  ctaText: "Shop Now",
  displayOrder: "0",
  isActive: true,
  showOnHomepage: false,
  startsAt: "",
  endsAt: "",
};

function DealPreviewCard({ data }: { data: typeof defaultFormData }) {
  const badgeColors: Record<string, string> = {
    yellow: "bg-yellow-500 text-black",
    red: "bg-red-500 text-white",
    green: "bg-green-500 text-white",
    purple: "bg-purple-500 text-white",
  };

  return (
    <Card className="overflow-hidden max-w-sm">
      <div className="relative aspect-square bg-gray-100">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt={data.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Flame className="h-16 w-16" />
          </div>
        )}
        {data.badgeText && (
          <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold ${badgeColors[data.badgeColor] || badgeColors.yellow}`}>
            {data.badgeText}
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-lg line-clamp-1">{data.title || "Deal Title"}</h3>
        {data.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{data.description}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {data.quantity && (
            <Badge variant="secondary">{data.quantity} pcs</Badge>
          )}
          {data.productSize && (
            <Badge variant="secondary">{data.productSize}</Badge>
          )}
          {data.productType && (
            <Badge variant="outline">{data.productType}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data.originalPrice && parseFloat(data.originalPrice) > parseFloat(data.dealPrice || "0") && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(parseFloat(data.originalPrice))}
            </span>
          )}
          <span className="text-xl font-bold text-primary">
            {data.dealPrice ? formatPrice(parseFloat(data.dealPrice)) : "$0.00"}
          </span>
        </div>
        <Button className="w-full" size="sm">
          {data.ctaText || "Shop Now"}
        </Button>
      </div>
    </Card>
  );
}

export default function AdminDeals() {
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: deals, isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/admin/deals"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        originalPrice: data.originalPrice || null,
        quantity: data.quantity ? parseInt(data.quantity) : null,
        displayOrder: parseInt(data.displayOrder) || 0,
        startsAt: data.startsAt || null,
        endsAt: data.endsAt || null,
      };
      const res = await fetch("/api/admin/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create deal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
      setShowForm(false);
      setFormData(defaultFormData);
      toast({ title: "Deal created successfully" });
    },
    onError: () => toast({ title: "Failed to create deal", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Deal> }) => {
      const res = await fetch(`/api/admin/deals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update deal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
      setEditingDeal(null);
      setFormData(defaultFormData);
      toast({ title: "Deal updated successfully" });
    },
    onError: () => toast({ title: "Failed to update deal", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/deals/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete deal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
      toast({ title: "Deal deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete deal", variant: "destructive" }),
  });

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      description: deal.description || "",
      imageUrl: deal.imageUrl || "",
      originalPrice: deal.originalPrice || "",
      dealPrice: deal.dealPrice,
      quantity: deal.quantity?.toString() || "",
      productSize: deal.productSize || "",
      productType: deal.productType || "",
      linkUrl: deal.linkUrl || "",
      badgeText: deal.badgeText || "",
      badgeColor: deal.badgeColor || "yellow",
      ctaText: deal.ctaText || "Shop Now",
      displayOrder: deal.displayOrder?.toString() || "0",
      isActive: deal.isActive,
      showOnHomepage: deal.showOnHomepage,
      startsAt: deal.startsAt ? new Date(deal.startsAt).toISOString().slice(0, 16) : "",
      endsAt: deal.endsAt ? new Date(deal.endsAt).toISOString().slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDeal) {
      const payload = {
        ...formData,
        originalPrice: formData.originalPrice || null,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        displayOrder: parseInt(formData.displayOrder) || 0,
        startsAt: formData.startsAt || null,
        endsAt: formData.endsAt || null,
      };
      updateMutation.mutate({ id: editingDeal.id, data: payload });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleHomepage = (deal: Deal) => {
    updateMutation.mutate({ 
      id: deal.id, 
      data: { showOnHomepage: !deal.showOnHomepage } 
    });
  };

  const toggleActive = (deal: Deal) => {
    updateMutation.mutate({ 
      id: deal.id, 
      data: { isActive: !deal.isActive } 
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDeal(null);
    setFormData(defaultFormData);
  };

  const homepageDeals = deals?.filter(d => d.showOnHomepage && d.isActive) || [];

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hot Deals</h1>
            <p className="text-gray-600">Manage promotional deal cards</p>
          </div>
          <Button onClick={() => { setShowForm(true); setEditingDeal(null); setFormData(defaultFormData); }} data-testid="button-add-deal">
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>

        {/* Help Guide */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base">
            <Flame className="h-5 w-5 text-red-600" />
            Quick Guide
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Plus className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Create Deals</span><br /><span className="text-gray-600">Add promo cards with images & prices</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Home className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Homepage Display</span><br /><span className="text-gray-600">Toggle to show in Hot Deals section</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Star className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Badges</span><br /><span className="text-gray-600">Add "Limited Time" or "Best Seller"</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Scheduling</span><br /><span className="text-gray-600">Set start & end dates for deals</span></p>
            </div>
          </div>
        </div>

        {homepageDeals.length > 0 && (
          <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Home className="h-5 w-5 text-orange-600" />
              <span className="font-semibold text-orange-800">Currently on Homepage ({homepageDeals.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {homepageDeals.map(deal => (
                <Badge key={deal.id} variant="secondary" className="bg-orange-100">
                  {deal.title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingDeal ? "Edit Deal" : "Create New Deal"}
            </h2>
            <div className="grid lg:grid-cols-3 gap-8">
              <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="100 3-inch Stickers for $29"
                      required
                      data-testid="input-deal-title"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Limited time offer on die-cut stickers"
                      rows={2}
                      data-testid="input-deal-description"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Image URL</label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="https://example.com/deal-image.jpg"
                      data-testid="input-deal-image"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Deal Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.dealPrice}
                      onChange={(e) => setFormData({ ...formData, dealPrice: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="29.00"
                      required
                      data-testid="input-deal-price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Original Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="49.00"
                      data-testid="input-deal-original-price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="100"
                      data-testid="input-deal-quantity"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Product Size</label>
                    <input
                      type="text"
                      value={formData.productSize}
                      onChange={(e) => setFormData({ ...formData, productSize: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="3 inch"
                      data-testid="input-deal-size"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Product Type</label>
                    <input
                      type="text"
                      value={formData.productType}
                      onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Die-Cut Stickers"
                      data-testid="input-deal-type"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Link URL</label>
                    <input
                      type="text"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="/products/die-cut-stickers-3x3"
                      data-testid="input-deal-link"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={formData.badgeText}
                      onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="HOT"
                      data-testid="input-deal-badge"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Badge Color</label>
                    <select
                      value={formData.badgeColor}
                      onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      data-testid="select-deal-badge-color"
                    >
                      <option value="yellow">Yellow</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Shop Now"
                      data-testid="input-deal-cta"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Order</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0"
                      data-testid="input-deal-order"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      value={formData.startsAt}
                      onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      data-testid="input-deal-start"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      value={formData.endsAt}
                      onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      data-testid="input-deal-end"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      data-testid="checkbox-deal-active"
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.showOnHomepage}
                      onChange={(e) => setFormData({ ...formData, showOnHomepage: e.target.checked })}
                      data-testid="checkbox-deal-homepage"
                    />
                    <span className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      Show on Homepage
                    </span>
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCancel} data-testid="button-deal-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-deal-save">
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingDeal ? "Update Deal" : "Create Deal"}
                  </Button>
                </div>
              </form>
              
              <div>
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">Live Preview</h3>
                <DealPreviewCard data={formData} />
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border-b last:border-b-0">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : !deals?.length ? (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <Flame className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Deals Yet</h3>
            <p className="text-gray-500 mb-4">Create your first promotional deal to attract customers</p>
            <Button onClick={() => setShowForm(true)} data-testid="button-create-first-deal">
              <Plus className="h-4 w-4 mr-2" />
              Create First Deal
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Deal</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Price</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">Details</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Homepage</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => (
                    <tr key={deal.id} className="border-b last:border-b-0 hover:bg-gray-50" data-testid={`row-deal-${deal.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {deal.imageUrl ? (
                            <img src={deal.imageUrl} alt={deal.title} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Flame className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{deal.title}</p>
                            {deal.badgeText && (
                              <Badge variant="secondary" className="text-xs">{deal.badgeText}</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-primary">{formatPrice(parseFloat(deal.dealPrice))}</p>
                          {deal.originalPrice && (
                            <p className="text-sm text-muted-foreground line-through">
                              {formatPrice(parseFloat(deal.originalPrice))}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {deal.quantity && <Badge variant="outline">{deal.quantity} pcs</Badge>}
                          {deal.productSize && <Badge variant="outline">{deal.productSize}</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="icon"
                          variant={deal.showOnHomepage ? "default" : "ghost"}
                          onClick={() => toggleHomepage(deal)}
                          title={deal.showOnHomepage ? "Remove from homepage" : "Add to homepage"}
                          data-testid={`button-toggle-homepage-${deal.id}`}
                        >
                          <Home className="h-4 w-4" />
                        </Button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleActive(deal)}
                          title={deal.isActive ? "Deactivate" : "Activate"}
                          data-testid={`button-toggle-active-${deal.id}`}
                        >
                          {deal.isActive ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(deal)} data-testid={`button-edit-deal-${deal.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this deal?")) {
                                deleteMutation.mutate(deal.id);
                              }
                            }}
                            data-testid={`button-delete-deal-${deal.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
