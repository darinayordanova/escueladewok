import { createClient, type QueryParams } from 'next-sanity';

export const rawClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  // Viewer token, so the site keeps working once the dataset is private
  // (it holds customers' names, emails and voucher codes). Server-only: never
  // import this client in a 'use client' component.
  token: process.env.SANITY_READ_TOKEN,
  // With a token, the API also returns unpublished drafts; the site must only show published content.
  perspective: 'published',
});

// Wrapper that forces no caching — next-sanity v12 otherwise uses force-cache
// which persists stale data even after Sanity publishes new content.
export const sanityClient = {
  fetch: <T>(query: string, params?: QueryParams): Promise<T> =>
    rawClient.fetch<T>(query, params ?? {}, { cache: 'no-store' }),
};
