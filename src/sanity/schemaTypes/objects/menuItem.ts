import { defineField, defineType } from 'sanity';

export const menuItem = defineType({
  name: 'menuItem',
  title: 'Menu Item',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Dish Name',
      type: 'localeString',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localeString',
      description: 'A short description of the dish (optional)',
    }),
    defineField({
      name: 'image',
      title: 'Dish Photo',
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
  ],
  preview: {
    select: { title: 'name.en', media: 'image' },
    prepare({ title, media }) {
      return { title: title ?? 'Unnamed dish', media };
    },
  },
});
