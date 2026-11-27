// One-off: remove checkouts that were never paid from Sanity.
//
//   node --env-file=.env.local scripts/remove-unpaid-checkouts.mjs          # dry run, changes nothing
//   node --env-file=.env.local scripts/remove-unpaid-checkouts.mjs --apply  # do it
//
// - courseSession: removes attendees from Stripe test mode (cs_test_…) and abandoned
//   checkouts (cancelled with no customer name — the "❌ Unknown" rows). A session left
//   with no attendees is deleted, unless another document references it.
// - giftVoucher / booking: documents with a cs_test_ session ID are deleted (unless referenced).
import { createRequire } from 'node:module';

const require = createRequire(`${process.cwd()}/package.json`);
const { createClient } = require('next-sanity');

const APPLY = process.argv.includes('--apply');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
  perspective: 'raw',
});

const isTest = (id) => typeof id === 'string' && id.startsWith('cs_test_');
const isUnpaid = (a) => isTest(a.stripeSessionId) || (a.status === 'cancelled' && !a.customerName);
const referencedBy = (id) => client.fetch('count(*[references($id)])', { id });

console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'} on dataset "${client.config().dataset}"\n`);

// ── Course sessions ──────────────────────────────────────────────────────────
const sessions = await client.fetch(
  `*[_type == "courseSession" && count(attendees[stripeSessionId match "cs_test_*" || (status == "cancelled" && (!defined(customerName) || customerName == ""))]) > 0]
     { _id, courseTitle, date, startTime, attendees }`,
);

let removedAttendees = 0;
let deletedSessions = 0;
for (const s of sessions) {
  const all = s.attendees ?? [];
  const test = all.filter(isUnpaid);
  const keep = all.length - test.length;
  removedAttendees += test.length;
  const label = `${s.courseTitle ?? '?'} ${s.date} ${s.startTime}`;

  if (keep === 0 && (await referencedBy(s._id)) === 0) {
    console.log(`  DELETE session  ${label}  (${test.length} unpaid attendee(s), nothing else)`);
    deletedSessions++;
    if (APPLY) await client.delete(s._id);
  } else {
    console.log(`  CLEAN  session  ${label}  remove ${test.length} unpaid, keep ${keep}`);
    if (APPLY) {
      await client
        .patch(s._id)
        .unset(test.map((a) => `attendees[_key == "${a._key}"]`))
        .commit();
    }
  }
}

// ── Gift vouchers & legacy bookings ──────────────────────────────────────────
const docs = await client.fetch(
  `*[_type in ["giftVoucher", "booking"] && stripeSessionId match "cs_test_*"] { _id, _type, code, customerName }`,
);
let deletedDocs = 0;
for (const d of docs) {
  if ((await referencedBy(d._id)) > 0) {
    console.log(`  SKIP   ${d._type} ${d._id}: referenced by another document`);
    continue;
  }
  console.log(`  DELETE ${d._type}  ${d.code ?? d.customerName ?? d._id}`);
  deletedDocs++;
  if (APPLY) await client.delete(d._id);
}

console.log(
  `\n${APPLY ? 'Done' : 'Would do'}: ${removedAttendees} unpaid attendee(s) removed, ` +
    `${deletedSessions} empty session(s) deleted, ${deletedDocs} voucher/booking doc(s) deleted.`,
);
if (!APPLY) console.log('Run again with --apply to make these changes.');
