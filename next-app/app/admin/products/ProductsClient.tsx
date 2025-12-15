"use client";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Plus, Pencil, Trash2, Check, X, Package, Upload, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ShippingType = "calculated" | "flat" | "free";

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
  shippingType?: ShippingType;
  flatShippingPrice?: string | null;
}

export default function AdminProducts() {
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
    shippingType: "calculated" as ShippingType,
    flatShippingPrice: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setShowCreateForm(false);
      toast({ title: "Product created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setEditingProduct(null);
      toast({ title: "Product updated" });
    },
  });

  return (
    <AdminLayout>
      <div className="p-6">
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>Add Product</Button>

        {showCreateForm && (
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-3">
            <input placeholder="Name" value={formData.name} onChange={(e)=>setFormData({...formData,name:e.target.value})} />
            <input placeholder="Price" value={formData.basePrice} onChange={(e)=>setFormData({...formData,basePrice:e.target.value})} />
            <select value={formData.shippingType} onChange={(e)=>setFormData({...formData,shippingType:e.target.value as ShippingType})}>
              <option value="calculated">Calculated</option>
              <option value="flat">Flat</option>
              <option value="free">Free</option>
            </select>
            {formData.shippingType==="flat" && (
              <input placeholder="Flat Shipping Price" value={formData.flatShippingPrice} onChange={(e)=>setFormData({...formData,flatShippingPrice:e.target.value})} />
            )}
            <Button type="submit">Create</Button>
          </form>
        )}

        {products?.map(p => (
          <div key={p.id}>
            <span>{p.name} — {formatPrice(p.basePrice)}</span>
            <Button onClick={()=>setEditingProduct(p)}>Edit</Button>
          </div>
        ))}

        {editingProduct && (
          <form onSubmit={(e)=>{e.preventDefault(); updateMutation.mutate({id:editingProduct.id,data:editingProduct});}}>
            <input value={editingProduct.name} onChange={(e)=>setEditingProduct({...editingProduct,name:e.target.value})} />
            <select value={editingProduct.shippingType||"calculated"} onChange={(e)=>setEditingProduct({...editingProduct,shippingType:e.target.value as ShippingType})}>
              <option value="calculated">Calculated</option>
              <option value="flat">Flat</option>
              <option value="free">Free</option>
            </select>
            {editingProduct.shippingType==="flat" && (
              <input value={editingProduct.flatShippingPrice||""} onChange={(e)=>setEditingProduct({...editingProduct,flatShippingPrice:e.target.value})} />
            )}
            <Button type="submit">Save</Button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
