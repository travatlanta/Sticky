import { Metadata } from 'next';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout - Sticky Banditos',
  description: 'Complete your order for custom stickers and labels.',
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
