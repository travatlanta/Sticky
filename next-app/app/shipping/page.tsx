import { Metadata } from 'next';
import { Truck, Clock, Package, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping Information - Sticky Banditos',
  description: 'Shipping rates, delivery times, and policies for Sticky Banditos custom printing.',
};

export default function ShippingPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Shipping Information</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">Production Time</h3>
              <p className="text-gray-600 text-sm">3-5 Business Days</p>
            </div>
          </div>
          <p className="text-gray-700 text-sm">
            Most orders are produced within 3-5 business days. Complex or large orders may take longer.
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Truck className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">Standard Shipping</h3>
              <p className="text-gray-600 text-sm">$15 Flat Rate</p>
            </div>
          </div>
          <p className="text-gray-700 text-sm">
            USPS Priority Mail or equivalent. Typically arrives 2-5 business days after production.
          </p>
        </div>
      </div>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Shipping Options</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Shipping Method</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Estimated Delivery</th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-4 py-3">Standard Shipping</td>
                  <td className="border border-gray-200 px-4 py-3">2-5 Business Days</td>
                  <td className="border border-gray-200 px-4 py-3">$15.00</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 px-4 py-3">Express Shipping</td>
                  <td className="border border-gray-200 px-4 py-3">1-2 Business Days</td>
                  <td className="border border-gray-200 px-4 py-3">Contact for Quote</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            * Delivery times are estimates from the date of shipment, not the order date. Production time is 
            in addition to shipping time.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Order Processing</h2>
          <div className="space-y-4 text-gray-700">
            <p className="leading-relaxed">
              Orders are processed in the order they are received. Here&apos;s what to expect:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li><strong>Order Confirmation:</strong> You&apos;ll receive an email confirmation immediately after placing your order.</li>
              <li><strong>Production:</strong> Your custom products are manufactured (typically 3-5 business days).</li>
              <li><strong>Quality Check:</strong> Each order is inspected before shipping.</li>
              <li><strong>Shipment:</strong> You&apos;ll receive a shipping confirmation email with tracking information.</li>
              <li><strong>Delivery:</strong> Your order arrives at your doorstep!</li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Shipping Locations</h2>
          <div className="flex items-start gap-4 bg-gray-50 rounded-lg p-6">
            <MapPin className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">United States Shipping</h3>
              <p className="text-gray-700">
                We currently ship to all 50 US states, including Alaska and Hawaii. Remote areas may 
                have slightly longer delivery times. APO/FPO addresses are also accepted.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-gray-50 rounded-lg p-6 mt-4">
            <Package className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">International Shipping</h3>
              <p className="text-gray-700">
                International shipping is available on a case-by-case basis. Please contact us before 
                placing an order for delivery outside the United States. Additional shipping charges 
                and customs/import duties may apply.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Tracking Your Order</h2>
          <p className="text-gray-700 leading-relaxed">
            Once your order ships, you&apos;ll receive an email with tracking information. You can also 
            view your order status and tracking details by logging into your account and visiting the 
            &quot;Orders&quot; page. Please allow 24 hours for tracking information to update after shipment.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Shipping Address</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Please ensure your shipping address is complete and accurate.</li>
            <li>Include apartment/suite numbers when applicable.</li>
            <li>We are not responsible for orders delayed or lost due to incorrect addresses provided by the customer.</li>
            <li>Address changes may not be possible once production has begun.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Lost or Damaged Packages</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            If your package is lost or arrives damaged:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Contact us within 14 days of the expected delivery date for lost packages.</li>
            <li>For damaged packages, take photos of the damage and packaging before opening.</li>
            <li>Keep all packaging materials until your claim is resolved.</li>
            <li>We will work with the shipping carrier to resolve the issue and, if appropriate, send a replacement.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-700 leading-relaxed">
            Have questions about shipping? Our team is here to help:
          </p>
          <address className="text-gray-700 not-italic mt-4">
            <strong>Sticky Banditos LLC</strong><br />
            2 North 35th Ave<br />
            Phoenix, AZ 85009
          </address>
        </section>
      </div>
    </div>
  );
}
