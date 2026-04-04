import { defineField, defineType } from 'sanity';

/**
 * Localized Portable Text — text-only blocks (paragraphs, headings, lists,
 * inline marks). Images live in dedicated imageSection / imageGallery blocks.
 */
export const localeBlockContent = defineType({
  name: 'localeBlockContent',
  title: 'Localized Rich Text',
  type: 'object',
  fields: [
    defineField({
      name: 'en',
      title: 'English',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'es',
      title: 'Spanish',
      type: 'array',
      of: [{ type: 'block' }],
    }),
  ],
});
