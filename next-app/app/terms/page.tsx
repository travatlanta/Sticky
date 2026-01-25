import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service - Sticky Banditos',
  description: 'Terms of Service for Sticky Banditos custom printing services.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 md:p-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-foreground">Terms of Service</h1>
          <p className="text-gray-600 dark:text-muted-foreground mb-8">Last Updated: January 2026</p>

          {/* Return Policy Highlight */}
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-8">
            <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-3">Important: Return & Refund Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Due to the custom nature of our products, we have a limited return policy:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
              <li><strong>No returns on approved custom orders</strong> - Once you approve your design proof, the order is final</li>
              <li><strong>Defective products</strong> - We will replace or refund products with manufacturing defects. Contact us within 7 days with photos</li>
              <li><strong>Shipping damage</strong> - Contact us within 7 days with photos. We will replace damaged items at no cost</li>
              <li><strong>Incorrect orders</strong> - If we made an error, we will correct it at no cost to you</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-3 text-sm">
              Refunds are processed within 5-10 business days and returned to the original payment method.
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-foreground">1. Agreement to Terms</h2>
          <p className="text-gray-700 leading-relaxed">
            By accessing or using the Sticky Banditos LLC website and services (located at stickybanditos.com), 
            you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not 
            use our services. We reserve the right to modify these terms at any time, and your continued use of 
            the site constitutes acceptance of any changes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Description of Services</h2>
          <p className="text-gray-700 leading-relaxed">
            Sticky Banditos LLC provides custom printing services including but not limited to stickers, labels, 
            decals, and related products. We offer an online design editor and accept customer-supplied artwork 
            for printing. All products are manufactured according to specifications provided at the time of order.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Orders and Payment</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>All orders are subject to acceptance and availability.</li>
            <li>Prices are subject to change without notice until an order is confirmed.</li>
            <li>Payment is required in full at the time of order placement.</li>
            <li>We accept major credit cards and other payment methods as displayed during checkout.</li>
            <li>Orders are not considered confirmed until payment has been successfully processed.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Custom Products and Artwork</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>You represent that you own or have the legal right to use any artwork, images, logos, or other content you submit for printing.</li>
            <li>You are responsible for ensuring your artwork meets our specifications and quality requirements.</li>
            <li>We reserve the right to refuse any order that contains content we deem inappropriate, illegal, or infringing on third-party rights.</li>
            <li>Color variations may occur between screen display and printed products due to differences in display calibration and printing processes.</li>
            <li>By submitting artwork, you grant us a limited license to reproduce your design solely for the purpose of fulfilling your order.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
          <p className="text-gray-700 leading-relaxed">
            All content on our website, including logos, graphics, text, and software, is the property of 
            Sticky Banditos LLC and is protected by intellectual property laws. You may not reproduce, 
            distribute, or create derivative works without our written permission. Any artwork you submit 
            remains your property; we claim no ownership rights over customer-submitted content.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Production and Shipping</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Production times are estimates and may vary based on order complexity and volume.</li>
            <li>Shipping times are estimated and not guaranteed. We are not responsible for carrier delays.</li>
            <li>Risk of loss passes to you upon delivery to the shipping carrier.</li>
            <li>Please review our Shipping Policy for detailed information on shipping options and timelines.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
          <p className="text-gray-700 leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, STICKY BANDITOS LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, 
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, 
            DATA, USE, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF OUR SERVICES. OUR TOTAL LIABILITY 
            FOR ANY CLAIM ARISING FROM THESE TERMS OR YOUR USE OF OUR SERVICES SHALL NOT EXCEED THE AMOUNT YOU 
            PAID FOR THE SPECIFIC ORDER GIVING RISE TO THE CLAIM.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Indemnification</h2>
          <p className="text-gray-700 leading-relaxed">
            You agree to indemnify, defend, and hold harmless Sticky Banditos LLC, its officers, directors, 
            employees, and agents from any claims, liabilities, damages, costs, or expenses (including reasonable 
            attorneys&apos; fees) arising from your use of our services, your violation of these terms, or your 
            infringement of any third-party rights including intellectual property rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
          <p className="text-gray-700 leading-relaxed">
            These Terms of Service shall be governed by and construed in accordance with the laws of the State 
            of Arizona, without regard to its conflict of law provisions. Any disputes arising under these terms 
            shall be resolved exclusively in the state or federal courts located in Maricopa County, Arizona.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>
          <p className="text-gray-700 leading-relaxed">
            For questions about these Terms of Service, please contact us at:
          </p>
          <address className="text-gray-700 not-italic mt-4">
            <strong>Sticky Banditos LLC</strong><br />
            Phone: (602) 554-5338<br />
            Email: mhobbs.stickybanditos@gmail.com
          </address>
        </section>
          </div>
        </div>
      </div>
    </div>
  );
}
