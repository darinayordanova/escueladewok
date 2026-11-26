import { defineField, defineType } from 'sanity';

/**
 * A newsletter signup and its proof of consent (RGPD art. 7.1).
 * Created and updated by /api/subscribe; read-only in the Studio.
 * Who is subscribed to which Topic, and who has unsubscribed, lives in Resend:
 * its unsubscribe page writes there, not here.
 */
export const subscriber = defineType({
  name: 'subscriber',
  title: 'Subscriber',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Waiting for email confirmation', value: 'pending' },
          { title: 'Confirmed', value: 'confirmed' },
        ],
        layout: 'radio',
      },
    }),
    defineField({ name: 'locale', title: 'Language', type: 'string' }),
    defineField({
      name: 'source',
      title: 'Signed up from',
      type: 'string',
      description: 'Where the form was, e.g. footer, christmas, checkout',
    }),
    // ─── Proof of consent ────────────────────────────────────────────────────
    defineField({ name: 'consentVersion', title: 'Consent text version', type: 'string' }),
    defineField({ name: 'consentText', title: 'Consent text shown', type: 'text', rows: 3 }),
    defineField({ name: 'consentedAt', title: 'Ticked the consent box at', type: 'datetime' }),
    defineField({ name: 'confirmationSentAt', title: 'Confirmation email sent at', type: 'datetime' }),
    defineField({ name: 'confirmedAt', title: 'Confirmed by email at', type: 'datetime' }),
    // ─── Sending ─────────────────────────────────────────────────────────────
    defineField({ name: 'resendContactId', title: 'Resend contact ID', type: 'string' }),
    defineField({
      name: 'lastNotifiedAt',
      title: 'Last automatic email at',
      type: 'datetime',
      description: 'Automatic emails (last spots, new dates) are sent at most once every 7 days',
    }),
  ],
  orderings: [{ title: 'Newest first', name: 'createdNewest', by: [{ field: '_createdAt', direction: 'desc' }] }],
  preview: {
    select: { email: 'email', status: 'status', source: 'source' },
    prepare({ email, status, source }) {
      return {
        title: `${status === 'confirmed' ? '✅' : '⏳'} ${email ?? '—'}`,
        subtitle: source ? `from ${source}` : undefined,
      };
    },
  },
});
