import type { ReactNode } from 'react';

import '@/styles/globals.scss';

// Root layout: provides the HTML shell.
// Lang attribute is set dynamically per locale in [locale]/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
