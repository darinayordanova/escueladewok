import { defineField, defineType } from 'sanity';

export const courseSession = defineType({
  name: 'courseSession',
  title: 'Course Session',
  type: 'document',
  // Created and managed programmatically — admin can update attendee statuses
  fields: [
    // ─── Session info ────────────────────────────────────────────────────────
    defineField({
      name: 'course',
      title: 'Course',
      type: 'reference',
      to: [{ type: 'course' }],
      readOnly: true,
    }),
    defineField({
      name: 'courseTitle',
      title: 'Course',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'courseSlug',
      title: 'Slug',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      readOnly: true,
    }),
    defineField({
      name: 'startTime',
      title: 'Start Time',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'endTime',
      title: 'End Time',
      type: 'string',
      readOnly: true,
    }),
    // ─── Attendees ───────────────────────────────────────────────────────────
    defineField({
      name: 'attendees',
      title: 'Attendees',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'customerName',
              title: 'Name',
              type: 'string',
            }),
            defineField({
              name: 'customerEmail',
              title: 'Email',
              type: 'string',
            }),
            defineField({
              name: 'customerPhone',
              title: 'Phone',
              type: 'string',
            }),
            defineField({
              name: 'dietaryRestrictions',
              title: 'Dietary Restrictions / Allergies',
              type: 'string',
            }),
            defineField({
              name: 'status',
              title: 'Status',
              type: 'string',
              options: {
                list: [
                  { title: 'Pending payment', value: 'pending' },
                  { title: 'Confirmed', value: 'confirmed' },
                  { title: 'Cancelled', value: 'cancelled' },
                ],
                layout: 'radio',
              },
              initialValue: 'pending',
            }),
            defineField({
              name: 'stripeSessionId',
              title: 'Stripe Session ID',
              type: 'string',
              readOnly: true,
            }),
            defineField({
              name: 'stripePaymentIntentId',
              title: 'Payment Reference',
              description: 'Use this in the Stripe dashboard to issue a refund',
              type: 'string',
              readOnly: true,
            }),
            defineField({
              name: 'amount',
              title: 'Amount Paid',
              type: 'number',
              readOnly: true,
            }),
            defineField({
              name: 'currency',
              title: 'Currency',
              type: 'string',
              readOnly: true,
            }),
            defineField({
              name: 'bookedAt',
              title: 'Booked At',
              type: 'datetime',
              readOnly: true,
            }),
            defineField({
              name: 'locale',
              title: 'Language',
              description: 'The language they booked in; their emails are sent in it',
              type: 'string',
              options: { list: [{ title: 'English', value: 'en' }, { title: 'Spanish', value: 'es' }] },
              readOnly: true,
            }),
            defineField({
              name: 'preClassEmailAt',
              title: 'Pre-class email',
              description: 'When the reminder email (allergies, directions, what to wear) is or was sent',
              type: 'datetime',
              readOnly: true,
            }),
            defineField({
              name: 'postClassEmailAt',
              title: 'Thank-you email',
              description: 'When the email with the recipes and review link is or was sent, the morning after the class',
              type: 'datetime',
              readOnly: true,
            }),
            defineField({
              name: 'postClassEmailId',
              title: 'Thank-you email ID (Resend)',
              type: 'string',
              readOnly: true,
              hidden: true,
            }),
            defineField({
              name: 'preClassEmailFor',
              title: 'Pre-class email scheduled for class at',
              type: 'string',
              readOnly: true,
              hidden: true,
            }),
            defineField({
              name: 'preClassEmailId',
              title: 'Pre-class email ID (Resend)',
              type: 'string',
              readOnly: true,
              hidden: true,
            }),
          ],
          preview: {
            select: {
              name: 'customerName',
              email: 'customerEmail',
              status: 'status',
            },
            prepare({ name, email, status }) {
              const icon = status === 'confirmed' ? '✅' : status === 'cancelled' ? '❌' : '⏳';
              return {
                title: `${icon} ${name ?? 'Unknown'}`,
                subtitle: email ?? '—',
              };
            },
          },
        },
      ],
    }),
  ],
  orderings: [
    {
      title: 'Date (soonest first)',
      name: 'dateSoonest',
      by: [
        { field: 'date', direction: 'asc' },
        { field: 'startTime', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: {
      courseTitle: 'courseTitle',
      date: 'date',
      startTime: 'startTime',
      endTime: 'endTime',
      attendees: 'attendees',
    },
    prepare({ courseTitle, date, startTime, endTime, attendees }) {
      const confirmed = (attendees ?? []).filter((a: { status: string }) => a.status === 'confirmed').length;
      const total = (attendees ?? []).length;
      return {
        title: `${courseTitle ?? 'Course'} — ${date ?? '?'}`,
        subtitle: `${startTime} – ${endTime} · ${confirmed}/${total} confirmed`,
      };
    },
  },
});
