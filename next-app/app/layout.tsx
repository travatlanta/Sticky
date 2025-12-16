import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ClientWrapper from '@/components/ClientWrapper';

export const metadata: Metadata = {
  title: 'Sticky Banditos - Custom Sticker Printing',
  description: 'Create custom stickers with our easy-to-use design editor. High-quality printing, fast shipping, and great prices.',
  keywords: 'custom stickers, sticker printing, die-cut stickers, vinyl stickers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50/50 via-white to-yellow-50/50">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ClientWrapper />
        </Providers>
      </body>
    </html>
  );
}
