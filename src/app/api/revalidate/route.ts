import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Called by a Sanity webhook whenever content is published.
 * Clears Next.js data cache for all content-driven pages.
 *
 * Protect with SANITY_REVALIDATE_SECRET set in both:
 *   - Vercel environment variables
 *   - Sanity webhook HTTP header (as "x-revalidate-secret")
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');

  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  // Parse which document type was published so we only revalidate what changed
  let body: { _type?: string } = {};
  try {
    body = await request.json();
  } catch {
    // body is optional — revalidate everything if we can't parse it
  }

  const type = body._type;

  if (!type || type === 'homepage') {
    revalidatePath('/[locale]', 'page');
  }

  if (!type || type === 'course') {
    revalidatePath('/[locale]/courses', 'page');
    revalidatePath('/[locale]/courses/[slug]', 'page');
    revalidatePath('/[locale]', 'page'); // homepage shows featured courses
  }

  if (!type || type === 'aboutPage') {
    revalidatePath('/[locale]/about', 'page');
  }

  if (!type || type === 'contactPage') {
    revalidatePath('/[locale]/contact', 'page');
  }

  if (!type || type === 'termsPage') {
    revalidatePath('/[locale]/terms', 'page');
  }

  if (!type || type === 'privacyPage') {
    revalidatePath('/[locale]/privacy', 'page');
  }

  return NextResponse.json({ revalidated: true, type: type ?? 'all' });
}
