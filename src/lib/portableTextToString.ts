import type { PortableTextBlock } from '@/types';

/**
 * Extracts a plain string from a Portable Text block array.
 * Useful for meta descriptions and card previews.
 */
export function portableTextToString(blocks: PortableTextBlock[]): string {
  return blocks
    .map((block) => {
      if (block._type !== 'block' || !Array.isArray(block.children)) return '';
      return (block.children as { text?: string }[])
        .map((child) => child.text ?? '')
        .join('');
    })
    .join(' ')
    .trim();
}
