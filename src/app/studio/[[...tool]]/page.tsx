'use client';

/**
 * Sanity Studio is embedded at /studio.
 * It is excluded from the next-intl middleware matcher so locale routing
 * does not interfere with it.
 */

import { NextStudio } from 'next-sanity/studio';

import config from '../../../../sanity.config';

export default function StudioPage() {
  return <NextStudio config={config} />;
}
