import { defineField, defineType } from 'sanity';

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  fields: [
    // ─── Hero ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'localeString',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'localeText',
    }),
    // ─── Page builder ─────────────────────────────────────────────────────────
    defineField({
      name: 'content',
      title: 'Page Content',
      type: 'array',
      of: [
        { type: 'textSection' },
        { type: 'imageSection' },
        { type: 'imageGallery' },
      ],
      description: 'Build the page — add text, images or galleries in any order',
    }),
    // ─── Team ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'teamTitle',
      title: 'Team Section Heading',
      type: 'localeString',
    }),
    defineField({
      name: 'team',
      title: 'Team Members',
      type: 'array',
      of: [{ type: 'teamMember' }],
    }),
  ],
  preview: {
    prepare() {
      return { title: 'About Page' };
    },
  },
});
