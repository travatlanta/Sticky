import { Product } from '@shared/types/product';

/**
 * SHIPPING IS COMPLETELY DISABLED.
 *
 * There is NO default shipping.
 * There is NO standard shipping.
 * There is NO fallback shipping.
 *
 * If shipping is ever re-enabled, it must be explicit and intentional.
 */

export function calculateShippingForItems(
  _items: {
    product: Product;
    quantity: number;
  }[]
): number {
  // Shipping is fully disabled
  return 0;
}
