'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type CartItem = {
  id: number;
  quantity: number;
  unitPrice: string | null;
  product: {
    id: number;
    name: string;
    slug: string;
    thumbnailUrl: string | null;
  } | null;
};

async function fetchCart() {
  const res = await fetch('/api/cart', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

async function addToCart(productId: number) {
  const res = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  if (!res.ok) throw new Error('Failed to add to cart');
  return res.json();
}

export default function CartClient() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
  });

  const addMutation = useMutation({
    mutationFn: addToCart,
    onSuccess: () => {
      // THIS IS THE FIX: force cart to re-fetch immediately
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading cart…</div>;
  }

  const items: CartItem[] = data?.items || [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {items.length === 0 && (
        <p className="text-gray-500">Your cart is empty.</p>
      )}

      <ul className="space-y-4">
        {items.map((item) =>
          item.product ? (
            <li key={item.id} className="flex items-center gap-4 border p-4">
              {item.product.thumbnailUrl && (
                <Image
                  src={item.product.thumbnailUrl}
                  alt={item.product.name}
                  width={64}
                  height={64}
                />
              )}
              <div className="flex-1">
                <div className="font-semibold">{item.product.name}</div>
                <div className="text-sm text-gray-500">
                  Quantity: {item.quantity}
                </div>
              </div>
            </li>
          ) : null
        )}
      </ul>
    </div>
  );
}
