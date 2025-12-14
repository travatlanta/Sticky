import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Sticky Banditos',
  description: 'Privacy Policy for Sticky Banditos custom printing services.',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-gray-600 mb-8">Last Updated: December 2024</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-gray-700 leading-relaxed">
            Sticky Banditos LLC (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is committed to protecting 
            your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard 
            your information when you visit our website and use our services. Please read this policy carefully.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-medium mb-3 mt-6">Personal Information</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            We may collect personal information that you voluntarily provide when:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Creating an account (name, email address, password)</li>
            <li>Placing an order (shipping address, billing address, phone number)</li>
            <li>Making a payment (payment card information is processed securely by our payment processor and not stored by us)</li>
            <li>Contacting customer support (communication history)</li>
            <li>Subscribing to newsletters or promotions</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 mt-6">Automatically Collected Information</h3>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Device information (browser type, operating system)</li>
            <li>IP address and approximate location</li>
            <li>Pages visited and time spent on our site</li>
            <li>Referring website or source</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 mt-6">Uploaded Content</h3>
          <p className="text-gray-700 leading-relaxed">
            When you use our design editor or upload artwork for printing, we store this content to process 
            your orders. This may include images, logos, text, and design files.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-700 leading-relaxed mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Process and fulfill your orders</li>
            <li>Send order confirmations, shipping updates, and delivery notifications</li>
            <li>Provide customer support and respond to inquiries</li>
            <li>Improve our website, products, and services</li>
            <li>Send promotional communications (with your consent)</li>
            <li>Detect and prevent fraud or unauthorized activity</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We do not sell your personal information. We may share your information with:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Service Providers:</strong> Third parties that help us operate our business (payment processors, shipping carriers, email services)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <p className="text-gray-700 leading-relaxed">
            We implement appropriate technical and organizational security measures to protect your personal 
            information against unauthorized access, alteration, disclosure, or destruction. However, no method 
            of transmission over the Internet or electronic storage is 100% secure. While we strive to protect 
            your information, we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We use cookies and similar technologies to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Remember your preferences and login status</li>
            <li>Understand how you use our website</li>
            <li>Improve site performance and user experience</li>
            <li>Provide personalized content and advertisements</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            You can control cookies through your browser settings. Disabling cookies may affect some site functionality.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Depending on your location, you may have the following rights regarding your personal information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Access and obtain a copy of your data</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict certain processing</li>
            <li>Opt-out of marketing communications</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            To exercise these rights, please contact us using the information provided below.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
          <p className="text-gray-700 leading-relaxed">
            We retain your personal information for as long as necessary to fulfill the purposes described in 
            this policy, unless a longer retention period is required by law. Order history and related records 
            are typically retained for seven years for tax and legal compliance purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Children&apos;s Privacy</h2>
          <p className="text-gray-700 leading-relaxed">
            Our services are not intended for children under 13 years of age. We do not knowingly collect 
            personal information from children under 13. If you believe we have collected information from 
            a child, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update this Privacy Policy from time to time. Changes will be posted on this page with 
            an updated effective date. We encourage you to review this policy periodically.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
          <p className="text-gray-700 leading-relaxed">
            If you have questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <address className="text-gray-700 not-italic mt-4">
            <strong>Sticky Banditos LLC</strong><br />
            1607 W Friess Dr<br />
            Phoenix, AZ<br />
          </address>
        </section>
      </div>
    </div>
  );
}
