import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import Providers from './providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ClientWrapper from '@/components/ClientWrapper';
import MainContent from '@/components/MainContent';

export const metadata: Metadata = {
  title: 'Sticky Banditos - Custom Sticker Printing',
  description: 'Create custom stickers with our easy-to-use design editor. High-quality printing, fast shipping, and great prices.',
  keywords: 'custom stickers, sticker printing, die-cut stickers, vinyl stickers',
};

const GA_TRACKING_ID = 'G-EXT24JDCC7';
const isProduction = process.env.NODE_ENV === 'production';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {isProduction && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_TRACKING_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50/50 via-white to-yellow-50/50 overflow-x-hidden">
        <Providers>
          <Navbar />
          <MainContent>{children}</MainContent>
          <Footer />
          <ClientWrapper />
        </Providers>
      </body>
    </html>
  );
}
