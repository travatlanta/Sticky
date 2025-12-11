import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Promotion {
  id: number;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  minOrderAmount: string | null;
  maxUses: number | null;
  usesCount: number;
  isActive: boolean;
  expiresAt: string | null;
}

export default function AdminPromotions() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    minOrderAmount: "",
    maxUses: "",
    isActive: true,
    expiresAt: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: promotions, isLoading } = useQuery<Promotion[]>({
    queryKey: ["/api/admin/promotions"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        code: data.code.toUpperCase(),
        minOrderAmount: data.minOrderAmount || null,
        maxUses: data.maxUses ? parseInt(data.maxUses) : null,
        expiresAt: data.expiresAt || null,
      };
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create promotion");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
      setShowCreateForm(false);
      setFormData({
        code: "",
        discountType: "percentage",
        discountValue: "",
        minOrderAmount: "",
        maxUses: "",
        isActive: true,
        expiresAt: "",
      });
      toast({ title: "Promotion created successfully" });
    },
    onError: () => toast({ title: "Failed to create promotion", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Promotion> }) => {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update promotion");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
      setEditingPromo(null);
      toast({ title: "Promotion updated successfully" });
    },
    onError: () => toast({ title: "Failed to update promotion", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete promotion");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
      toast({ title: "Promotion deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete promotion", variant: "destructive" }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Promotions</h1>
            <p className="text-gray-600 text-sm md:text-base">Manage discount codes</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Promotion
          </Button>
        </div>

        {/* Help Guide */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Tag className="h-4 w-4 text-purple-600" />
            Quick Guide
          </h3>
          <ul className="text-sm text-gray-600 space-y-1.5">
            <li><span className="font-medium text-gray-700">Create Codes:</span> Click "Add Promotion" to create discount codes that customers can apply at checkout.</li>
            <li><span className="font-medium text-gray-700">Discount Types:</span> Choose "percentage" (e.g., 20% off) or "fixed" (e.g., $10 off) for your discount.</li>
            <li><span className="font-medium text-gray-700">Limits:</span> Set minimum order amounts and maximum uses to control how promotions are applied.</li>
            <li><span className="font-medium text-gray-700">Expiration:</span> Set an expiration date to create time-limited promotions that drive urgency.</li>
          </ul>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-4">Create New Promotion</h2>
            <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg uppercase"
                  placeholder="SUMMER20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) =>
                    setFormData({ ...formData, discountType: e.target.value as "percentage" | "fixed" })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Discount Value {formData.discountType === "percentage" ? "(%)" : "($)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min Order Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Uses</label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expires At</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-center col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>
              <div className="col-span-2 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Promotion"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border-b">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : promotions && promotions.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Code</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Discount</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Uses</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {promotions.map((promo) => (
                  <tr key={promo.id}>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-gray-900">{promo.code}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {promo.discountType === "percentage"
                        ? `${promo.discountValue}%`
                        : formatPrice(promo.discountValue)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {promo.usesCount} {promo.maxUses ? `/ ${promo.maxUses}` : ""}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          promo.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {promo.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingPromo(promo)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this promotion?")) {
                            deleteMutation.mutate(promo.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No promotions yet</h3>
            <p className="text-gray-500 mb-4">Create your first discount code</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Promotion
            </Button>
          </div>
        )}

        {editingPromo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Edit Promotion</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateMutation.mutate({
                    id: editingPromo.id,
                    data: editingPromo,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <input
                    type="text"
                    value={editingPromo.code}
                    onChange={(e) =>
                      setEditingPromo({ ...editingPromo, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 border rounded-lg uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPromo.discountValue}
                    onChange={(e) =>
                      setEditingPromo({ ...editingPromo, discountValue: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingPromo.isActive}
                      onChange={(e) =>
                        setEditingPromo({ ...editingPromo, isActive: e.target.checked })
                      }
                    />
                    <span>Active</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setEditingPromo(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
