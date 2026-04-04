import { defineField, defineType } from 'sanity';

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact Page',
  type: 'document',
  fields: [
    // ─── Header ───────────────────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'localeString',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'localeText',
    }),
    // ─── Contact info ─────────────────────────────────────────────────────────
    defineField({
      name: 'email',
      title: 'Email Address',
      type: 'string',
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'localeText',
    }),
    // ─── Form ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'formTitle',
      title: 'Form Heading',
      type: 'localeString',
    }),
    defineField({
      name: 'successMessage',
      title: 'Success Message',
      description: 'Shown after the form is submitted successfully',
      type: 'localeText',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Contact Page' };
    },
  },
});
