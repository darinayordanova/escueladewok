import { createClient } from 'next-sanity';

/**
 * Server-only Sanity client with a write token.
 * Never import this in client components.
 * Used exclusively in API routes (checkout, webhooks).
 */
export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2025-01-01',
  useCdn: false, // always fresh reads; required for writes
  token: process.env.SANITY_WRITE_TOKEN,
});
