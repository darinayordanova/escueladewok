import { defineField, defineType } from 'sanity';

export const homepage = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
   
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'localeString',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'localeText',
    }),
    defineField({
      name: 'heroCtaLabel',
      title: 'Hero CTA Button Label',
      type: 'localeString',
    }),
   
    defineField({
      name: 'featuredCoursesTitle',
      title: 'Featured Courses Section Title',
      type: 'localeString',
    }),

    defineField({
      name: 'howItWorksTitle',
      title: 'How It Works — Section Title',
      type: 'localeString',
    }),
    defineField({
      name: 'howItWorksSteps',
      title: 'How It Works — Steps',
      type: 'array',
      of: [{
        type: 'object',
        name: 'howItWorksStep',
        fields: [
          defineField({ name: 'title', title: 'Title', type: 'localeString', validation: r => r.required() }),
          defineField({ name: 'description', title: 'Description', type: 'localeText' }),
        ],
        preview: { select: { title: 'title.en' } },
      }],
      validation: r => r.max(6),
    }),

    defineField({
      name: 'testimonialsTitle',
      title: 'Testimonials — Section Title',
      type: 'localeString',
    }),
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      of: [{
        type: 'object',
        name: 'testimonial',
        fields: [
          defineField({ name: 'quote', title: 'Quote', type: 'localeText', validation: r => r.required() }),
          defineField({ name: 'author', title: 'Author Name', type: 'string', validation: r => r.required() }),
          defineField({
            name: 'course',
            title: 'Course Taken (optional)',
            type: 'reference',
            to: [{ type: 'course' }],
            description: 'Shown under the author name, localized using that course\'s own title.',
          }),
          defineField({
            name: 'dateTaken',
            title: 'Month/Year Taken (optional)',
            type: 'date',
            options: { dateFormat: 'MMMM YYYY' },
            description: 'Only the month and year are displayed on the site.',
          }),
        ],
        preview: {
          select: { author: 'author', quote: 'quote.en', courseTitle: 'course.title.en' },
          prepare({ author, quote, courseTitle }: { author?: string; quote?: string; courseTitle?: string }) {
            return {
              title: courseTitle ? `${author ?? 'Testimonial'} — ${courseTitle}` : author ?? 'Testimonial',
              subtitle: quote ? `"${quote.slice(0, 60)}…"` : '',
            };
          },
        },
      }],
    }),

    defineField({
      name: 'galleryTitle',
      title: 'Gallery — Section Title',
      type: 'localeString',
      description: 'Shown under the testimonials. Leave the images empty to hide the section.',
    }),
    defineField({
      name: 'galleryImages',
      title: 'Gallery — Photos',
      type: 'array',
      description: 'Shown as scattered polaroids (cropped to 4:5 — set the hotspot on each photo). 4, 8 or 12 photos fill the rows best on desktop.',
      of: [{
        type: 'image',
        options: { hotspot: true },
        fields: [
          defineField({
            name: 'alt',
            title: 'Alt text',
            type: 'localeString',
            description: 'Describe the photo for screen readers and SEO.',
            validation: r => r.required(),
          }),
          defineField({
            name: 'caption',
            title: 'Caption (optional)',
            type: 'localeString',
            description: 'Short, handwritten-style note under the photo, e.g. "Dumpling night 🥟".',
          }),
        ],
        preview: {
          select: { media: 'asset', caption: 'caption.en', alt: 'alt.en' },
          prepare({ media, caption, alt }: { media?: unknown; caption?: string; alt?: string }) {
            return { title: caption || alt || 'Photo', media: media as never };
          },
        },
      }],
      options: { layout: 'grid' },
      validation: r => r.max(12),
    }),

    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Homepage' };
    },
  },
});
