import { createClient, type QueryParams } from 'next-sanity';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
});

// Wrapper that forces no caching — next-sanity v12 otherwise uses force-cache
// which persists stale data even after Sanity publishes new content.
export const sanityClient = {
  fetch: <T>(query: string, params?: QueryParams): Promise<T> =>
    client.fetch<T>(query, params, { cache: 'no-store' }),
};
