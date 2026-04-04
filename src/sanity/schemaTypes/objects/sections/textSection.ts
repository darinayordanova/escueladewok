import { defineField, defineType } from 'sanity';

export const textSection = defineType({
  name: 'textSection',
  title: 'Text Section',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'localeString',
      description: 'Optional section heading',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'localeBlockContent',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { heading: 'heading.en' },
    prepare({ heading }: { heading?: string }) {
      return { title: 'Text Section', subtitle: heading ?? '—' };
    },
  },
});
