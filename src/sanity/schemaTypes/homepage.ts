import { defineField, defineType } from 'sanity';

export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'localeString',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'localeText',
    }),
    defineField({
      name: 'heroCtaLabel',
      title: 'Hero CTA Button Label',
      type: 'localeString',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'localeString',
        }),
      ],
    }),
    defineField({
      name: 'featuredCoursesTitle',
      title: 'Featured Courses Section Title',
      type: 'localeString',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Homepage' };
    },
  },
});
