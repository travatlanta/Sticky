import { Product } from '@/shared/types/product';

export function calculateShipping(products: Product[], address: any): number {
  let total = 0;

  for (const p of products) {
    if (p.shippingType === 'flat' && p.flatShippingPrice) {
      total += p.flatShippingPrice;
    }
  }

  return total;
}
