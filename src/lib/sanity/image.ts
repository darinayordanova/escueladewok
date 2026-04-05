import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';

import { rawClient } from './client';

const builder = imageUrlBuilder(rawClient);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
