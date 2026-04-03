import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except Next.js internals, API routes, studio, and static files
  matcher: ['/((?!api|_next|_vercel|studio|.*\\..*).*)'],
};
