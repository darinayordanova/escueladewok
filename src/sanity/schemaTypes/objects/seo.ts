import { defineField, defineType } from 'sanity';

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'object',
      description: 'Overrides the <title> tag and og:title / twitter:title. " | Wok Lab" is appended automatically — don’t include it here. Leave blank to use the default title.',
      fields: [
        defineField({
          name: 'en',
          title: 'English',
          type: 'string',
          validation: (rule) => rule.max(60).warning('Titles over ~60 characters (before " | Wok Lab" is appended) may be truncated in search results'),
        }),
        defineField({
          name: 'es',
          title: 'Spanish',
          type: 'string',
          validation: (rule) => rule.max(60).warning('Titles over ~60 characters (before " | Wok Lab" is appended) may be truncated in search results'),
        }),
      ],
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'object',
      description: 'Overrides the meta description and og:description / twitter:description. Leave blank to use the default.',
      fields: [
        defineField({
          name: 'en',
          title: 'English',
          type: 'text',
          rows: 3,
          validation: (rule) => rule.max(160).warning('Descriptions over ~160 characters may be truncated in search results'),
        }),
        defineField({
          name: 'es',
          title: 'Spanish',
          type: 'text',
          rows: 3,
          validation: (rule) => rule.max(160).warning('Descriptions over ~160 characters may be truncated in search results'),
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'metaTitle.en' },
    prepare({ title }: { title?: string }) {
      return { title: 'SEO', subtitle: title || 'No override set' };
    },
  },
});
