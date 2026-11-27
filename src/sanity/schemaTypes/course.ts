import { defineArrayMember, defineField, defineType } from 'sanity';

import { ALLERGENS } from '../../lib/courses/allergens';

const altField = defineField({
  name: 'alt',
  title: 'Alt text',
  type: 'localeString',
});

export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  groups: [
    { name: 'details', title: 'Details', default: true },
    { name: 'page', title: 'Page content' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeString',
      group: 'details',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'details',
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
      group: ['details', 'page'],
      description: 'Shown on course cards and in the page intro (two columns on desktop). Also used for search engines.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      group: 'details',
      description: 'Main photo — course cards and the top of the course page',
      options: { hotspot: true },
      fields: [altField],
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      group: 'details',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      group: 'details',
      initialValue: 'EUR',
      options: {
        list: ['EUR', 'USD', 'GBP'],
      },
    }),
    defineField({
      name: 'duration',
      title: 'Duration (minutes)',
      type: 'number',
      group: 'details',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'maxParticipants',
      title: 'Max Participants',
      type: 'number',
      group: 'details',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'cuisine',
      title: 'Cuisine',
      type: 'string',
      group: 'details',
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
      group: 'details',
      initialValue: false,
    }),
    defineField({
      name: 'brochure',
      title: 'Brochure (PDF)',
      type: 'file',
      group: 'details',
      options: { accept: 'application/pdf' },
      description: 'Optional PDF brochure — shown as a download link on corporate course pages',
    }),
    defineField({
      name: 'recipes',
      title: 'Recipe book (PDF)',
      type: 'file',
      group: 'details',
      options: { accept: 'application/pdf' },
      description: 'Sent to everyone who took the class, in the thank-you email the morning after. Name it WokLab_TitleInES_TitleInEN.pdf',
    }),
    defineField({
      name: 'timeSlots',
      title: 'Time Slots',
      type: 'array',
      group: 'details',
      of: [{ type: 'timeSlot' }],
      description: 'Add a slot for each distinct start time, then add the dates within it',
    }),
    defineField({
      name: 'instructor',
      title: 'Instructor',
      type: 'localeString',
      group: 'details',
    }),
    defineField({
      name: 'featured',
      title: 'Featured on Homepage',
      type: 'boolean',
      group: 'details',
      initialValue: false,
    }),

    // ─── Page content ─────────────────────────────────────────────────────────
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'object',
      group: 'page',
      description: 'Opening statement under the photo. The description is shown beneath it.',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'localeString', description: 'Short line above, e.g. "Master the sizzle"' }),
        defineField({ name: 'headline', title: 'Headline', type: 'localeText', description: 'One or two sentences in large type' }),
      ],
    }),
    defineField({
      name: 'banner',
      title: 'Photo banner',
      type: 'object',
      group: 'page',
      description: 'Full-width photo with a caption. Hidden when there is no image.',
      fields: [
        defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true }, fields: [altField] }),
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'localeString', description: 'e.g. "Learn by doing"' }),
        defineField({ name: 'title', title: 'Caption', type: 'localeString', description: 'e.g. "Fold, toss, taste."' }),
      ],
    }),
    defineField({
      name: 'menu',
      title: 'Course Menu',
      type: 'array',
      group: 'page',
      of: [{ type: 'menuItem' }],
      description: 'The dishes students will learn to cook in this course',
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      group: 'page',
      description: 'Up to 3 photos. The first one is shown large.',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [altField],
        }),
      ],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: 'allergenList',
      title: 'Allergens',
      type: 'array',
      group: 'page',
      description: 'Tick every allergen this course contains or may use',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: ALLERGENS.map(({ value, title }) => ({ value, title })),
        layout: 'grid',
      },
    }),
    defineField({
      name: 'allergens',
      title: 'Allergen notes (optional)',
      type: 'localeBlockContent',
      group: 'page',
      description: 'Extra detail shown under the allergen list, e.g. which dish contains what',
    }),
    defineField({
      name: 'about',
      title: 'About this Course (old)',
      type: 'array',
      group: 'page',
      of: [
        { type: 'textSection' },
        { type: 'imageSection' },
        { type: 'imageGallery' },
      ],
      deprecated: { reason: 'No longer shown on the course page — use Intro, Photo banner and Gallery instead.' },
      readOnly: true,
      hidden: ({ value }) => !value,
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
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
