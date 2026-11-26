import path from 'path';

import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const securityHeaders = [
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  { key: 'X-XSS-Protection',          value: '1; mode=block' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  // The voucher PDF reads its fonts and illustrations from disk, so ship them with the routes that build it
  outputFileTracingIncludes: {
    '/api/webhooks/stripe': ['./public/fonts/**/*', './public/images/vouchers/**/*'],
    '/api/dev/voucher-pdf': ['./public/fonts/**/*', './public/images/vouchers/**/*'],
  },
  sassOptions: {
    includePaths: [path.resolve('src/styles')],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/:locale(en|es)/navidad', destination: '/:locale/christmas', permanent: false },
      { source: '/:locale(en|es)/san-valentin', destination: '/:locale/valentines', permanent: false },
      // Instagram bio link for the Christmas gift cards
      {
        source: '/regalo',
        destination: '/es/christmas?utm_source=instagram&utm_medium=bio&utm_campaign=xmas-giftcards',
        statusCode: 302,
      },
    ];
  },
  async headers() {
    return [
      // Security headers on every response
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // No-cache only for API routes and Sanity studio
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
      {
        source: '/studio/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
