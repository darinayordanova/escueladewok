import { DownloadIcon } from '@sanity/icons';
import { useDocumentOperation, useEditState } from 'sanity';

interface Attendee {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  dietaryRestrictions?: string;
  status?: string;
}

interface CourseSessionDoc {
  courseTitle?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  attendees?: Attendee[];
}

export function DownloadParticipantsAction(props: { id: string; type: string }) {
  const editState = useEditState(props.id, props.type);
  const doc = (editState.published ?? editState.draft) as CourseSessionDoc | null;

  return {
    label: 'Download participants',
    icon: DownloadIcon,
    onHandle: () => {
      if (!doc) return;

      const confirmed = (doc.attendees ?? []).filter((a) => a.status === 'confirmed');

      const rows = [
        ['Course', doc.courseTitle ?? ''],
        ['Date', doc.date ?? ''],
        ['Time', `${doc.startTime ?? ''} – ${doc.endTime ?? ''}`],
        [],
        ['Name', 'Email', 'Phone', 'Dietary restrictions'],
        ...confirmed.map((a) => [
          a.customerName ?? '',
          a.customerEmail ?? '',
          a.customerPhone ?? '',
          a.dietaryRestrictions ?? '',
        ]),
      ];

      const csv = rows
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.courseTitle ?? 'participants'} – ${doc.date ?? ''}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  };
}
