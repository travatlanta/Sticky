export type ShippingType = 'free' | 'flat' | 'calculated';

export interface Product {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  active: boolean;
  featured?: boolean;
  imageUrl?: string;

  shippingType: ShippingType;
  flatShippingPrice?: number | null;
}
