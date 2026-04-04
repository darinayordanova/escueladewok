import { defineField, defineType } from 'sanity';

export const imageGallery = defineType({
  name: 'imageGallery',
  title: 'Image Gallery',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'localeString',
      description: 'Optional heading above the gallery',
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'localeString',
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'localeString',
            }),
          ],
        },
      ],
      validation: (rule) => rule.required().min(2),
    }),
  ],
  preview: {
    select: { heading: 'heading.en', images: 'images' },
    prepare({ heading, images }: { heading?: string; images?: unknown[] }) {
      const count = images?.length ?? 0;
      return {
        title: 'Image Gallery',
        subtitle: heading ? `${heading} · ${count} images` : `${count} images`,
      };
    },
  },
});
