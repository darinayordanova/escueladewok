import { defineField, defineType } from 'sanity';

export const booking = defineType({
  name: 'booking',
  title: 'Booking',
  type: 'document',
  fields: [
    // ─── Course info (denormalized for fast display) ─────────────────────────
    defineField({
      name: 'course',
      title: 'Course',
      type: 'reference',
      to: [{ type: 'course' }],
      readOnly: true,
    }),
    defineField({
      name: 'courseTitle',
      title: 'Course Title',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'courseSlug',
      title: 'Course Slug',
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
    // ─── Customer ─────────────────────────────────────────────────────────────
    defineField({
      name: 'customerName',
      title: 'Customer Name',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'customerEmail',
      title: 'Customer Email',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'customerPhone',
      title: 'Customer Phone',
      type: 'string',
      readOnly: true,
    }),
    // ─── Payment ─────────────────────────────────────────────────────────────
    defineField({
      name: 'stripeSessionId',
      title: 'Stripe Session ID',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'stripePaymentIntentId',
      title: 'Stripe Payment Intent ID',
      type: 'string',
      description: 'Use this as the payment reference for refunds in the Stripe dashboard',
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
    // ─── Status ───────────────────────────────────────────────────────────────
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
    {
      title: 'Booked (newest first)',
      name: 'createdNewest',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      customerName: 'customerName',
      courseTitle: 'courseTitle',
      date: 'date',
      startTime: 'startTime',
      status: 'status',
    },
    prepare({ customerName, courseTitle, date, startTime, status }) {
      const statusEmoji = status === 'confirmed' ? '✅' : status === 'cancelled' ? '❌' : '⏳';
      return {
        title: `${statusEmoji} ${customerName ?? 'Unknown'}`,
        subtitle: `${courseTitle ?? '—'} · ${date ?? '—'} ${startTime ?? ''}`,
      };
    },
  },
});
