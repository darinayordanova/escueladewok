import { NextResponse } from 'next/server';

import { rawClient } from '@/lib/sanity/client';
import { homepageQuery } from '@/lib/sanity/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Bypass our wrapper entirely — call the raw client directly
  // with an explicit fetch using no caching whatsoever
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
  const token = process.env.SANITY_API_TOKEN;

  const url = `https://${projectId}.api.sanity.io/v2025-01-01/data/query/${dataset}?query=${encodeURIComponent(homepageQuery)}`;

  const rawResponse = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Cache-Control': 'no-cache',
    },
    cache: 'no-store',
  });
  const rawJson = await rawResponse.json();

  // Also try via next-sanity client for comparison
  const clientResult = await rawClient.fetch(homepageQuery, {}, { cache: 'no-store' } as never);

  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    viaRawFetch: rawJson.result,
    viaClient: clientResult,
  });
}
