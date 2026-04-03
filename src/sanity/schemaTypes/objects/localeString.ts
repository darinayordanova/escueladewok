import { defineField, defineType } from 'sanity';

export const localeString = defineType({
  name: 'localeString',
  title: 'Localized String',
  type: 'object',
  fields: [
    defineField({
      name: 'en',
      title: 'English',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'es',
      title: 'Spanish',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
});
