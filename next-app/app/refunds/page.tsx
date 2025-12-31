import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy - Sticky Banditos',
  description: 'Refund and return policy for Sticky Banditos custom printing services.',
};

export default function RefundsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Refund &amp; Return Policy</h1>
      <p className="text-gray-600 mb-8">Last Updated: December 2024</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2 text-orange-900">Important Notice</h2>
          <p className="text-orange-800">
            Because all products are custom-made to your specifications, we have specific guidelines regarding 
            refunds and returns. Please read this policy carefully before placing your order.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Custom Products Policy</h2>
          <p className="text-gray-700 leading-relaxed">
            All products sold by Sticky Banditos LLC are custom-manufactured according to your specific design 
            and specifications. Due to the personalized nature of our products, we are unable to accept returns 
            or issue refunds for orders that have been printed correctly according to your approved design.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">When We Will Issue a Refund or Reprint</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We stand behind the quality of our work. We will provide a full refund or free reprint if:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Manufacturing Defects:</strong> The product has visible printing errors, color issues 
            significantly different from proof, material defects, or damage caused during production.</li>
            <li><strong>Wrong Product:</strong> You received a different product than what you ordered.</li>
            <li><strong>Missing Items:</strong> Your order arrived incomplete.</li>
            <li><strong>Shipping Damage:</strong> Products were damaged during shipping (please keep all 
            packaging for inspection).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">When Refunds Are Not Available</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We cannot offer refunds or reprints in the following situations:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Design errors in customer-supplied artwork (typos, low-resolution images, incorrect colors)</li>
            <li>Minor color variations due to monitor calibration differences (colors may appear slightly 
            different in print than on screen)</li>
            <li>Change of mind after production has begun</li>
            <li>Incorrect shipping information provided by the customer</li>
            <li>Products that have been used, applied, or altered</li>
            <li>Orders placed with incorrect quantities or specifications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How to Request a Refund</h2>
          <div className="space-y-4 text-gray-700">
            <p className="leading-relaxed">
              If you believe you are entitled to a refund, please follow these steps:
            </p>
            <ol className="list-decimal pl-6 space-y-3">
              <li>
                <strong>Contact us within 14 days</strong> of receiving your order. Claims made after 14 days 
                may not be eligible for resolution.
              </li>
              <li>
                <strong>Provide your order number</strong> and a detailed description of the issue.
              </li>
              <li>
                <strong>Include clear photographs</strong> showing the defect or problem. For shipping damage, 
                also photograph the packaging.
              </li>
              <li>
                <strong>Keep all packaging and products</strong> until your claim is resolved. We may request 
                the items be returned for inspection.
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Refund Processing</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>All refund requests will be reviewed within 3-5 business days.</li>
            <li>Approved refunds will be credited to your original payment method within 7-10 business days.</li>
            <li>You will receive an email confirmation when your refund is processed.</li>
            <li>Shipping costs are non-refundable unless the error was ours.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Order Cancellations</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Because we begin production quickly to ensure fast delivery:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Orders may be cancelled within 1 hour of placement for a full refund.</li>
            <li>After 1 hour, orders that have entered production cannot be cancelled.</li>
            <li>To request cancellation, contact us immediately with your order number.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Reprints</h2>
          <p className="text-gray-700 leading-relaxed">
            When a reprint is approved, we will produce replacement products at no additional cost to you. 
            Reprints are typically processed within 2-3 business days and shipped using the same method as 
            your original order. Expedited shipping for reprints may be available at an additional cost.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-700 leading-relaxed">
            For refund requests or questions about this policy, please contact our customer support team:
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
