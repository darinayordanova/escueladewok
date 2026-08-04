import { defineField, defineType } from 'sanity';

export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeString',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title.en',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localeBlockContent',
    }),
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
        }),
      ],
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      initialValue: 'EUR',
      options: {
        list: ['EUR', 'USD', 'GBP'],
      },
    }),
    defineField({
      name: 'duration',
      title: 'Duration (minutes)',
      type: 'number',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'maxParticipants',
      title: 'Max Participants',
      type: 'number',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'cuisine',
      title: 'Cuisine',
      type: 'string',
      options: {
        list: [
          { title: 'Chinese', value: 'chinese' },
          { title: 'Korean', value: 'korean' },
          { title: 'Japanese', value: 'japanese' },
          { title: 'Thai', value: 'thai' },
          { title: 'Vietnamese', value: 'vietnamese' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'corporateEvent',
      title: 'Corporate Event',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'brochure',
      title: 'Brochure (PDF)',
      type: 'file',
      options: { accept: 'application/pdf' },
      description: 'Optional PDF brochure — shown as a download link on corporate course pages',
    }),
    defineField({
      name: 'timeSlots',
      title: 'Time Slots',
      type: 'array',
      of: [{ type: 'timeSlot' }],
      description: 'Add a slot for each distinct start time, then add the dates within it',
    }),
    defineField({
      name: 'about',
      title: 'About this Course',
      type: 'array',
      of: [
        { type: 'textSection' },
        { type: 'imageSection' },
        { type: 'imageGallery' },
      ],
      description: 'Build the course detail page — add text, images or galleries in any order',
    }),
    defineField({
      name: 'menu',
      title: 'Course Menu',
      type: 'array',
      of: [{ type: 'menuItem' }],
      description: 'The dishes students will learn to cook in this course',
    }),
    defineField({
      name: 'allergens',
      title: 'Allergens',
      type: 'localeBlockContent',
      description: 'Describe the allergens in this course. You can bold specific allergen names.',
    }),
    defineField({
      name: 'instructor',
      title: 'Instructor',
      type: 'localeString',
    }),
    defineField({
      name: 'featured',
      title: 'Featured on Homepage',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title.en',
      subtitle: 'cuisine',
      media: 'image',
    },
  },
});
