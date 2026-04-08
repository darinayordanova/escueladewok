import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Montserrat } from 'next/font/google';

import 'leaflet/dist/leaflet.css';

import '@/styles/globals.scss';

import { SITE_NAME, SITE_URL } from '@/lib/seo';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-paragraph',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#860A15',
};

// Root layout: provides the HTML shell.
// Lang attribute is set dynamically per locale in [locale]/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning className={`${fraunces.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
