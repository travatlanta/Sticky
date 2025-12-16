"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Upload, Trash2 } from "lucide-react";

export default function ProductDetailClient() {
  const { slug } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { data: product } = useQuery({
    queryKey: ["/api/products", slug],
    queryFn: async () => {
      const r = await fetch(`/api/products/${slug}`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleAddToCart = async () => {
    if (!product?.id) {
      alert("Product not ready yet, please try again.");
      return;
    }

    if (!product?.id) { alert('Product not ready'); return; }

    await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        quantity: 1,
      }),
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-2 gap-8">
      <div>
        <img src={product?.imageUrl} className="rounded-xl" />
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-2">{product?.name}</h1>
        <p className="text-xl font-semibold mb-4">${Number(product?.basePrice ?? 0).toFixed(2)}</p>

        {!file && (
          <label className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center cursor-pointer">
            <Upload className="mb-2" />
            <span>Upload print-ready file</span>
            <input
              type="file"
              hidden
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            />
          </label>
        )}

        {file && (
          <div className="border rounded-xl p-4">
            <img src={preview!} className="h-40 mx-auto mb-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm">{file.name}</span>
              <Button variant="ghost" onClick={() => setFile(null)}>
                <Trash2 />
              </Button>
            </div>
          </div>
        )}

        <Button className="mt-6 w-full" onClick={handleAddToCart}>
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
