import { defineField, defineType } from 'sanity';

export const timeSlot = defineType({
  name: 'timeSlot',
  title: 'Time Slot',
  type: 'object',
  fields: [
    defineField({
      name: 'startTime',
      title: 'Start Time',
      type: 'string',
      description: 'Format: HH:MM (e.g. 18:30)',
      validation: (rule) =>
        rule
          .required()
          .regex(/^\d{2}:\d{2}$/, { name: 'HH:MM', invert: false })
          .custom((value: string | undefined) => {
            if (!value) return true;
            const [h, m] = value.split(':').map(Number);
            if (h < 0 || h > 23) return 'Hours must be between 00 and 23';
            if (m < 0 || m > 59) return 'Minutes must be between 00 and 59';
            return true;
          }),
    }),
    defineField({
      name: 'dates',
      title: 'Dates',
      type: 'array',
      of: [{ type: 'date' }],
      description: 'Add every date this course runs at the above start time',
    }),
  ],
  preview: {
    select: {
      startTime: 'startTime',
      dates: 'dates',
    },
    prepare({ startTime, dates }: { startTime?: string; dates?: unknown[] }) {
      const count = dates?.length ?? 0;
      return {
        title: startTime ?? 'No time set',
        subtitle: `${count} date${count !== 1 ? 's' : ''}`,
      };
    },
  },
});
