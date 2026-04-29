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
      name: 'featuredCoursesTitle',
      title: 'Featured Courses Section Title',
      type: 'localeString',
    }),

    defineField({
      name: 'howItWorksTitle',
      title: 'How It Works — Section Title',
      type: 'localeString',
    }),
    defineField({
      name: 'howItWorksSteps',
      title: 'How It Works — Steps',
      type: 'array',
      of: [{
        type: 'object',
        name: 'howItWorksStep',
        fields: [
          defineField({ name: 'title', title: 'Title', type: 'localeString', validation: r => r.required() }),
          defineField({ name: 'description', title: 'Description', type: 'localeText' }),
        ],
        preview: { select: { title: 'title.en' } },
      }],
      validation: r => r.max(6),
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Homepage' };
    },
  },
});
