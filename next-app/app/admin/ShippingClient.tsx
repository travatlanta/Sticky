"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * ShippingClient provides a simple form to view and update global shipping
 * settings. It fetches the current settings from `/api/settings/shipping` and
 * allows administrators to adjust the base shipping cost, enable free shipping,
 * and toggle an automatic shipping calculation. Changes are persisted via a
 * POST request to the same API. The component also handles loading and
 * mutation states using the updated API of TanStack Query v5.
 */
export default function ShippingClient() {
  const queryClient = useQueryClient();

  // Fetch current shipping settings from the API. The `isLoading` flag
  // indicates whether the query is in a loading state. In TanStack Query v5
  // `isLoading` still exists on queries, so it can be used directly.
  const { data, isLoading } = useQuery({
    queryKey: ['shippingSettings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/shipping');
      if (!res.ok) throw new Error('Failed to load shipping settings');
      return res.json();
    },
  });

  // Local state to control the form inputs. Defaults are overridden by
  // values returned from the API when the query resolves.
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [freeShipping, setFreeShipping] = useState<boolean>(false);
  const [automaticShipping, setAutomaticShipping] = useState<boolean>(false);

  // Synchronise the form state with data from the API once it loads.
  useEffect(() => {
    if (data) {
      setShippingCost(data.shippingCost ?? 0);
      setFreeShipping(data.freeShipping ?? false);
      setAutomaticShipping(data.automaticShipping ?? false);
    }
  }, [data]);

  // Create a mutation for saving the shipping settings. TanStack Query v5
  // exposes a `status` property rather than individual booleans like
  // `isLoading` or `isPending` on mutation results. We derive a boolean
  // `isMutating` from the status to determine when the mutation is in
  // flight so we can disable the submit button and show a loading label.
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
      // Invalidate the cached settings to refetch updated values.
      queryClient.invalidateQueries({ queryKey: ['shippingSettings'] });
    },
  });

  // Determine if the mutation is currently running. In v5 of TanStack
  // Query the mutation object exposes a `status` string which is
  // `'idle'`, `'loading'`, `'pending'`, `'success'` or `'error'`. We treat
  // both `'loading'` and `'pending'` as active so that the UI can show a
  // loading state and prevent multiple submissions.
  const isMutating = (mutation as any).status === 'loading' || (mutation as any).status === 'pending';

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Shipping Settings</h1>
      {isLoading ? (
        <p>Loading…</p>
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
            Automatic shipping uses the base shipping cost multiplied by the
            number of items in the cart. This provides a simple volume‑based
            rate.
          </p>
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded shadow disabled:opacity-50"
            disabled={isMutating}
          >
            {isMutating ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      )}
    </div>
  );
}