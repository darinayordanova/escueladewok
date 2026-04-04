import { defineField, defineType } from 'sanity';

export const imageSection = defineType({
  name: 'imageSection',
  title: 'Image Section',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'localeString',
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'localeString',
      description: 'Optional caption displayed below the image',
    }),
  ],
  preview: {
    select: { media: 'image', caption: 'caption.en' },
    prepare({ media, caption }) {
      return { title: 'Image Section', subtitle: caption ?? '—', media };
    },
  },
});
