"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * ShippingClient provides a simple form to view and update global shipping
 * settings. It fetches the current settings from `/api/settings/shipping` and
 * allows administrators to adjust the base shipping cost or enable free
 * shipping. Changes are persisted via a POST request to the same API.
 */
export default function ShippingClient() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['shippingSettings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/shipping');
      if (!res.ok) throw new Error('Failed to load shipping settings');
      return res.json();
    },
  });

  const [shippingCost, setShippingCost] = useState<number>(0);
  const [freeShipping, setFreeShipping] = useState<boolean>(false);
  const [automaticShipping, setAutomaticShipping] = useState<boolean>(false);

  // When data is loaded, sync local state
  useEffect(() => {
    if (data) {
      setShippingCost(data.shippingCost ?? 0);
      setFreeShipping(data.freeShipping ?? false);
      setAutomaticShipping(data.automaticShipping ?? false);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingCost, freeShipping, automaticShipping }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Unable to save settings');
      }
      return res.json();
    },
    onSuccess: () => {
      // Refresh cached settings
      queryClient.invalidateQueries({ queryKey: ['shippingSettings'] });
    },
  });

  // Simple styled components using Tailwind classes. Tailwind is available in
  // this project for consistent styling across the admin interface.
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Shipping Settings</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-6"
        >
          <div>
            <label htmlFor="shippingCost" className="block font-medium mb-1">
              Shipping Cost ($)
            </label>
            <input
              id="shippingCost"
              type="number"
              min="0"
              step="0.01"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={shippingCost}
              onChange={(e) => setShippingCost(parseFloat(e.target.value))}
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the flat shipping fee in dollars. Use 0 for no cost.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              id="freeShipping"
              type="checkbox"
              checked={freeShipping}
              onChange={(e) => setFreeShipping(e.target.checked)}
              className="h-4 w-4 border-gray-300 rounded"
            />
            <label htmlFor="freeShipping" className="font-medium">
              Enable free shipping
            </label>
          </div>
          <p className="text-sm text-gray-500">
            When free shipping is enabled, customers will not be charged for
            shipping regardless of the base cost.
          </p>

        <div className="flex items-center space-x-2">
          <input
            id="automaticShipping"
            type="checkbox"
            checked={automaticShipping}
            onChange={(e) => setAutomaticShipping(e.target.checked)}
            className="h-4 w-4 border-gray-300 rounded"
          />
          <label htmlFor="automaticShipping" className="font-medium">
            Enable automatic shipping calculation
          </label>
        </div>
        <p className="text-sm text-gray-500">
          Automatic shipping uses the base shipping cost multiplied by the number
          of items in the cart. This provides a simple volume‑based rate.
        </p>
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded shadow disabled:opacity-50"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      )}
    </div>
  );
}