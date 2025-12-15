import { Product } from '@shared/types/product';

/**
 * Shipping calculation logic
 *
 * IMPORTANT:
 * - There is NO default / standard / fallback shipping fee.
 * - Shipping is determined strictly by product configuration.
 */

export function calculateShippingForItems(
  items: {
    product: Product;
    quantity: number;
  }[]
): number {
  let totalShipping = 0;

  for (const item of items) {
    const { product, quantity } = item;

    switch (product.shippingType) {
      case 'free':
        // Explicitly free shipping
        break;

      case 'flat':
        // Flat rate per product (NOT per quantity)
        if (product.flatShippingPrice) {
          totalShipping += Number(product.flatShippingPrice);
        }
        break;

      case 'calculated':
      default:
        // No default shipping fee anymore
        // Calculated shipping can be implemented later
        break;
    }
  }

  return totalShipping;
}
