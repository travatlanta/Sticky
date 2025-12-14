/*
 * Global error page for Sticky Banditos.
 *
 * When any uncaught error occurs in the app router, this component will be
 * rendered. It provides a consistent, friendly experience for users by
 * displaying the brand logo and offering simple steps to recover. Users can
 * reload the page or navigate back to the home page. Updating this file
 * ensures all client-side exceptions share the same template.
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';

// According to Next.js docs, error components receive two props: the error
// object and a reset function to retry the rendering. We don’t need the
// digest here, but preserving the generic types ensures type safety.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
        {/* Site logo */}
        <Image
          src="/logo-icon.png"
          alt="Sticky Banditos logo"
          width={80}
          height={80}
          className="mb-4 rounded-md shadow-md"
        />
        <h1 className="text-3xl font-bold mb-2">Oops! Something went wrong.</h1>
        <p className="text-gray-600 mb-6">
          We're experiencing a technical difficulty. Please try reloading the page or head back to the home page.
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