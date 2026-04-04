import { defineField, defineType } from 'sanity';

export const termsPage = defineType({
  name: 'termsPage',
  title: 'Terms of Service',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'localeString',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last Updated',
      type: 'date',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'localeBlockContent',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Terms of Service' };
    },
  },
});
