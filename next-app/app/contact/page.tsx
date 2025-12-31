import { Metadata } from 'next';
import { MapPin, Mail, Clock, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us - Sticky Banditos',
  description: 'Get in touch with Sticky Banditos for questions about custom printing.',
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
      <p className="text-gray-600 mb-12">
        Have a question about your order or need help with a custom project? We&apos;re here to help!
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">Live Chat</h3>
              <p className="text-gray-600 text-sm">Chat with our support team</p>
            </div>
          </div>
          <p className="text-gray-700 text-sm">
            Use the chat widget in the bottom-right corner of your screen. Our AI assistant can answer 
            most questions instantly, or connect you with a human if needed.
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">Response Time</h3>
              <p className="text-gray-600 text-sm">Within 24 hours</p>
            </div>
          </div>
          <p className="text-gray-700 text-sm">
            We aim to respond to all inquiries within 24 hours during business days. For urgent matters, 
            please use the live chat.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-6">Business Information</h2>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <MapPin className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Mailing Address</h3>
              <address className="text-gray-700 not-italic">
                Sticky Banditos LLC<br />
                2 North 35th Ave<br />
                Phoenix, AZ 85009
              </address>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Common Questions</h2>
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-medium mb-2">Where is my order?</h3>
            <p className="text-gray-700 text-sm">
              Log into your account and visit the &quot;Orders&quot; page to see your order status and tracking information. 
              If your order has shipped, you&apos;ll find a tracking link there.
            </p>
          </div>
          <div className="border-b pb-4">
            <h3 className="font-medium mb-2">I need to change my shipping address</h3>
            <p className="text-gray-700 text-sm">
              Contact us as soon as possible. Address changes may not be possible once production has begun, 
              but we&apos;ll do our best to help.
            </p>
          </div>
          <div className="border-b pb-4">
            <h3 className="font-medium mb-2">There&apos;s a problem with my order</h3>
            <p className="text-gray-700 text-sm">
              We&apos;re sorry to hear that! Please contact us with your order number and photos of the issue. 
              We stand behind our quality and will make it right.
            </p>
          </div>
          <div className="pb-4">
            <h3 className="font-medium mb-2">I have a custom or bulk order request</h3>
            <p className="text-gray-700 text-sm">
              We love working on custom projects! Reach out with details about your project, including 
              quantities, sizes, and any special requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
