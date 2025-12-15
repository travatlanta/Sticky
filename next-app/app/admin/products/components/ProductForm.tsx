'use client';

import { useState } from 'react';
import { Product, ShippingType } from '@/shared/types/product';

export default function ProductForm({ product }: { product?: Product }) {
  const [shippingType, setShippingType] = useState<ShippingType>(product?.shippingType || 'calculated');
  const [flatPrice, setFlatPrice] = useState<number>(product?.flatShippingPrice || 0);

  return (
    <div>
      <h3>Shipping</h3>
      <select value={shippingType} onChange={e => setShippingType(e.target.value as ShippingType)}>
        <option value="calculated">Calculated</option>
        <option value="flat">Flat</option>
        <option value="free">Free</option>
      </select>

      {shippingType === 'flat' && (
        <input
          type="number"
          value={flatPrice}
          onChange={e => setFlatPrice(Number(e.target.value))}
          placeholder="Flat shipping price"
        />
      )}
    </div>
  );
}
