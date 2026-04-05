import { NextResponse } from 'next/server';

import { sanityClient } from '@/lib/sanity/client';
import { homepageQuery } from '@/lib/sanity/queries';

export async function GET() {
  const data = await sanityClient.fetch(homepageQuery);
  return NextResponse.json(data);
}
