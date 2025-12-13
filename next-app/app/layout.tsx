import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Providers from './providers';

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
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
