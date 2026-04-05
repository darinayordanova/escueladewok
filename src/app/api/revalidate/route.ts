import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');

  if (!process.env.SANITY_REVALIDATE_SECRET) {
    console.error('[revalidate] SANITY_REVALIDATE_SECRET env var is not set');
    return NextResponse.json({ message: 'Server misconfiguration' }, { status: 500 });
  }

  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    console.warn('[revalidate] Invalid secret received:', secret?.slice(0, 6));
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  let body: { _type?: string } = {};
  try {
    body = await request.json();
  } catch {
    // no body — revalidate everything
  }

  const type = body._type;
  console.log('[revalidate] Triggered for type:', type ?? 'all');

  // Revalidate the root layout — this clears cached data for every page at once
  revalidatePath('/', 'layout');

  console.log('[revalidate] Done');
  return NextResponse.json({ revalidated: true, type: type ?? 'all' });
}
