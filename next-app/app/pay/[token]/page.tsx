import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  // Find order by token and redirect to order page
  try {
    const result = await db.execute(sql`
      SELECT id FROM orders 
      WHERE notes LIKE ${'%Payment Link: ' + token + '%'}
      LIMIT 1
    `);

    if (result.rows && result.rows.length > 0) {
      const order = result.rows[0] as any;
      redirect(`/orders/${order.id}`);
    }
  } catch (error) {
    console.error("Error looking up order by token:", error);
  }
  
  // If order not found, show a message
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">
            This payment link may have expired or the order has already been processed.
          </p>
          <a href="/" className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            Return to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
