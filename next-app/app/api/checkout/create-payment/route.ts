'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

type Cart = {
  items: CartItem[];
  subtotal: number;
};

export default function CheckoutClient() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');

  const { data: cart } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await fetch('/api/cart', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load cart');
      return res.json();
    },
  });

  const createPayment = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/checkout/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

      return res.json();
    },
    onSuccess: () => {
      router.push('/orders');
    },
    onError: (err) => {
      console.error('Checkout failed:', err);
      alert('Payment failed. Please check your details.');
    },
  });

  const handlePay = async () => {
    // Square Web Payments SDK injects card nonce globally
    // @ts-ignore
    const tokenResult = await window.squarePayments?.tokenize();

    if (!tokenResult || tokenResult.status !== 'OK') {
      alert('Payment tokenization failed');
      return;
    }

    createPayment.mutate({
      sourceId: tokenResult.token,
      shippingAddress: {
        firstName,
        lastName,
        address1,
        address2,
        city,
        state,
        zip,
        phone,
      },
    });
  };

  if (!cart || !cart.items.length) {
    return <p className="p-8">Your cart is empty.</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">
      <h1 className="text-3xl font-bold">Checkout</h1>

      {/* SHIPPING ADDRESS */}
      <section className="bg-white rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
          <input placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
          <input placeholder="Address Line 1" value={address1} onChange={e => setAddress1(e.target.value)} />
          <input placeholder="Address Line 2" value={address2} onChange={e => setAddress2(e.target.value)} />
          <input placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
          <input placeholder="State" value={state} onChange={e => setState(e.target.value)} />
          <input placeholder="ZIP Code" value={zip} onChange={e => setZip(e.target.value)} />
          <input placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
      </section>

      {/* PAYMENT */}
      <section className="bg-white rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Payment</h2>
        <div id="card-container" className="border p-4 rounded" />
        <button
          className="mt-6 bg-orange-500 text-white px-6 py-3 rounded w-full"
          onClick={handlePay}
          disabled={createPayment.isLoading}
        >
          {createPayment.isLoading ? 'Processing...' : 'Pay'}
        </button>
      </section>

      {/* ORDER SUMMARY */}
      <section className="bg-white rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

        {cart.items.map(item => (
          <div key={item.productId} className="flex justify-between py-2">
            <span>{item.name} × {item.quantity}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}

        <hr className="my-4" />

        <div className="flex justify-between">
          <strong>Total</strong>
          <strong>${cart.subtotal.toFixed(2)}</strong>
        </div>
      </section>
    </div>
  );
}
