/*
 * Checkout-specific error page
 *
 * When an uncaught exception occurs during the checkout process, this page
 * provides a consistent and friendly experience. It mirrors the global
 * error page, displaying the Sticky Banditos logo and offering simple
 * actions to recover: reload the page or return home. Keeping this file
 * scoped to the checkout route ensures that errors within the payment
 * flow render a helpful message instead of the generic Next.js error.
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';

// The error boundary for the checkout route receives the error and a reset
// function to retry rendering. The digest property is optional and not used
// here, but included for completeness.
export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
        <Image
          src="/logo-icon.png"
          alt="Sticky Banditos logo"
          width={80}
          height={80}
          className="mb-4 rounded-md shadow-md"
        />
        <h1 className="text-3xl font-bold mb-2">Uh‑oh! Checkout issue.</h1>
        <p className="text-gray-600 mb-6">
          We're experiencing a technical difficulty with checkout. Please try
          reloading the page or head back to the home page.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          >
            Reload Page
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </body>
    </html>
  );
}