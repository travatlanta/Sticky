/**
 * This page renders the shipping settings management UI. It delegates all
 * interactive logic to the client component defined in `ShippingClient.tsx`.
 */
import ShippingClient from './ShippingClient';

export default function Page() {
  return <ShippingClient />;
}