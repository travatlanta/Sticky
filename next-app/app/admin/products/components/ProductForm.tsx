'use client';

import { useState } from 'react';

type ShippingType = 'free' | 'flat' | 'calculated';

interface Product {
  shippingType?: ShippingType;
  flatShippingPrice?: number | null;
}

export default function ProductForm({ product }: { product?: Product }) {
  const [shippingType, setShippingType] = useState<ShippingType>(
    product?.shippingType ?? 'calculated'
  );
  const [flatPrice, setFlatPrice] = useState<number>(
    product?.flatShippingPrice ?? 0
  );

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-semibold mb-2">Shipping</h3>

      <label className="block mb-2">
        <span className="text-sm">Shipping Type</span>
        <select
          className="w-full border rounded px-2 py-1"
          value={shippingType}
          onChange={(e) => setShippingType(e.target.value as ShippingType)}
        >
          <option value="calculated">Calculated</option>
          <option value="flat">Flat</option>
          <option value="free">Free</option>
        </select>
      </label>

      {shippingType === 'flat' && (
        <label className="block mt-2">
          <span className="text-sm">Flat Shipping Price</span>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded px-2 py-1"
            value={flatPrice}
            onChange={(e) => setFlatPrice(Number(e.target.value))}
          />
        </label>
      )}
    </div>
  );
}
