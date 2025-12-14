import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ - Sticky Banditos',
  description: 'Frequently asked questions about Sticky Banditos custom printing services.',
};

const faqs = [
  {
    category: 'Ordering',
    questions: [
      {
        q: 'What file formats do you accept for artwork?',
        a: 'We accept PNG, JPG, PDF, and SVG files. For best results, we recommend high-resolution PNG or PDF files at 300 DPI or higher. Vector files (SVG, PDF with vector graphics) will produce the sharpest results.',
      },
      {
        q: 'What is your minimum order quantity?',
        a: 'Minimum order quantities vary by product. Most of our sticker products have a minimum of 25-50 pieces. Check the individual product page for specific minimums.',
      },
      {
        q: 'Can I order a sample before placing a large order?',
        a: 'Yes! We recommend ordering a small quantity first to ensure you\'re happy with the colors, size, and quality before placing a larger order.',
      },
      {
        q: 'How do I know my artwork will print correctly?',
        a: 'After you design or upload your artwork, you\'ll see a preview in our editor. What you see on screen is representative of the final print, though colors may vary slightly between monitors and printed materials.',
      },
    ],
  },
  {
    category: 'Products',
    questions: [
      {
        q: 'What materials are your stickers made from?',
        a: 'Our stickers are made from high-quality vinyl that is waterproof, weather-resistant, and UV-protected. They\'re designed to last outdoors for 3-5 years without fading or peeling.',
      },
      {
        q: 'Are your stickers waterproof?',
        a: 'Yes! Our vinyl stickers are fully waterproof and can withstand rain, snow, and regular washing. They\'re perfect for water bottles, cars, laptops, and outdoor applications.',
      },
      {
        q: 'What is a die-cut sticker?',
        a: 'A die-cut sticker is cut precisely to the shape of your design with no extra background material. This gives a custom, professional look compared to standard rectangular stickers.',
      },
      {
        q: 'What\'s the difference between matte and glossy finish?',
        a: 'Glossy finish has a shiny, reflective surface that makes colors pop. Matte finish has a non-reflective surface with a more subtle, premium look. Both are equally durable.',
      },
    ],
  },
  {
    category: 'Shipping & Delivery',
    questions: [
      {
        q: 'How long does production take?',
        a: 'Most orders are produced within 3-5 business days. Large or complex orders may take longer. You\'ll receive an email when your order ships.',
      },
      {
        q: 'How much is shipping?',
        a: 'Standard shipping is a flat rate of $15 within the United States. Express shipping is available for an additional charge - contact us for a quote.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'International shipping is available on a case-by-case basis. Please contact us before placing an order for delivery outside the United States.',
      },
      {
        q: 'How do I track my order?',
        a: 'Once your order ships, you\'ll receive an email with tracking information. You can also log into your account and visit the Orders page to view your order status.',
      },
    ],
  },
  {
    category: 'Returns & Refunds',
    questions: [
      {
        q: 'What is your refund policy?',
        a: 'Since all products are custom-made, we cannot accept returns for change of mind. However, if your order has a manufacturing defect or was damaged in shipping, we\'ll gladly provide a refund or free reprint.',
      },
      {
        q: 'What if there\'s a problem with my order?',
        a: 'Contact us within 14 days of receiving your order with photos of the issue. We\'ll review your claim and work to make it right, whether that\'s a refund or reprint.',
      },
      {
        q: 'Can I cancel my order?',
        a: 'Orders can be cancelled within 1 hour of placement for a full refund. After that, orders in production cannot be cancelled.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
      <p className="text-gray-600 mb-12">
        Find answers to common questions about our products, ordering, and shipping.
        Can&apos;t find what you&apos;re looking for? <Link href="/contact" className="text-orange-500 hover:underline">Contact us</Link>.
      </p>

      <div className="space-y-12">
        {faqs.map((section) => (
          <section key={section.category}>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <ChevronRight className="h-5 w-5 text-orange-500" />
              {section.category}
            </h2>
            <div className="space-y-6">
              {section.questions.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                  <h3 className="font-medium text-lg mb-2">{faq.q}</h3>
                  <p className="text-gray-700 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 bg-orange-50 rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Still have questions?</h2>
        <p className="text-gray-600 mb-4">
          Our team is happy to help with any questions you have.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 transition-colors"
        >
          Contact Us
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
