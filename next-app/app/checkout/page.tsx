'use client';

import { useState } from 'react';

export default function CheckoutPage() {
  const [shipping, setShipping] = useState(0);

  async function getQuote() {
    const res = await fetch('/api/checkout/shipping-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: [], address: {} })
    });
    const data = await res.json();
    setShipping(data.shipping);
  }

  return (
    <div>
      <h1>Checkout</h1>
      <button onClick={getQuote}>Get Shipping Quote</button>
      <p>Shipping: ${shipping.toFixed(2)}</p>
    </div>
  );
}
