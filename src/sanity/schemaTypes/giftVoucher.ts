import { defineField, defineType } from 'sanity';

export const giftVoucher = defineType({
  name: 'giftVoucher',
  title: 'Gift Voucher',
  type: 'document',
  fields: [
    defineField({ name: 'code', title: 'Voucher Code', type: 'string', readOnly: true }),
    defineField({
      name: 'voucherType',
      title: 'Type',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          { title: 'Cooking Class', value: 'classVoucher' },
          { title: 'Cooking Class for Two', value: 'classVoucherForTwo' },
          { title: 'Gift Card 25 €', value: 'giftCard25' },
          { title: 'Gift Card 50 €', value: 'giftCard50' },
        ],
      },
    }),
    defineField({ name: 'amount', title: 'Amount (€)', type: 'number', readOnly: true }),
    defineField({ name: 'currency', title: 'Currency', type: 'string', readOnly: true }),
    // Buyer
    defineField({ name: 'buyerName', title: 'Buyer Name', type: 'string', readOnly: true }),
    defineField({ name: 'buyerEmail', title: 'Buyer Email', type: 'string', readOnly: true }),
    // Recipient (optional)
    defineField({ name: 'recipientName', title: 'Recipient Name', type: 'string', readOnly: true }),
    defineField({ name: 'recipientEmail', title: 'Recipient Email', type: 'string', readOnly: true }),
    defineField({ name: 'recipientMessage', title: 'Personal Message', type: 'text', readOnly: true }),
    defineField({ name: 'scheduledSendDate', title: 'Scheduled Send Date', type: 'datetime', readOnly: true }),
    defineField({ name: 'sentAt', title: 'Sent At', type: 'datetime', readOnly: true }),
    // Stripe
    defineField({ name: 'stripeSessionId', title: 'Stripe Session ID', type: 'string', readOnly: true }),
    defineField({ name: 'stripeCouponId', title: 'Stripe Coupon ID', type: 'string', readOnly: true }),
    defineField({ name: 'stripePromotionCodeId', title: 'Stripe Promotion Code ID', type: 'string', readOnly: true }),
    // Dates
    defineField({ name: 'issuedAt', title: 'Issued At', type: 'datetime', readOnly: true }),
    defineField({ name: 'expiresAt', title: 'Expires At', type: 'date', readOnly: true }),
    defineField({ name: 'redeemedAt', title: 'Redeemed At', type: 'datetime', readOnly: true }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Redeemed', value: 'redeemed' },
          { title: 'Expired', value: 'expired' },
          { title: 'Cancelled', value: 'cancelled' },
        ],
        layout: 'radio',
      },
      initialValue: 'active',
    }),
  ],
  orderings: [
    { title: 'Newest first', name: 'issuedDesc', by: [{ field: 'issuedAt', direction: 'desc' }] },
  ],
  preview: {
    select: {
      code: 'code',
      voucherType: 'voucherType',
      amount: 'amount',
      status: 'status',
      buyerEmail: 'buyerEmail',
    },
    prepare({ code, voucherType, amount, status, buyerEmail }) {
      const icon = status === 'redeemed' ? '✅' : status === 'cancelled' ? '❌' : status === 'expired' ? '⏳' : '🎁';
      const typeLabel = voucherType === 'classVoucher' ? 'Class' : `${amount} €`;
      return {
        title: `${icon} ${code ?? '—'} — ${typeLabel}`,
        subtitle: buyerEmail ?? '—',
      };
    },
  },
});
