import { defineField, defineType } from 'sanity';

export const privacyPage = defineType({
  name: 'privacyPage',
  title: 'Privacy Policy',
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
      return { title: 'Privacy Policy' };
    },
  },
});
