'use client';

import { openConsentSettings } from '@/lib/analytics/consent';

/** Footer link that reopens the cookie banner, so the choice can be changed later. */
export default function CookieSettingsLink({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" className={className} onClick={openConsentSettings}>
      {label}
    </button>
  );
}
