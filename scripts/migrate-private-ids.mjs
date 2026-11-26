// One-off: move documents holding customers' personal data to private IDs
// (an ID with a dot can only be read with a token, even in a public dataset).
//
//   node --env-file=.env.local scripts/migrate-private-ids.mjs          # dry run, changes nothing
//   node --env-file=.env.local scripts/migrate-private-ids.mjs --apply  # do it
//
// Each document is copied to `private.<type>.<oldId>` and the old one deleted, in one
// transaction. A draft of it (drafts.<oldId>) moves with it. Documents that other
// documents reference are skipped and listed, so nothing ends up pointing at nothing.
import { createRequire } from 'node:module';

const require = createRequire(`${process.cwd()}/package.json`);
const { createClient } = require('next-sanity');

const APPLY = process.argv.includes('--apply');
const TYPES = ['courseSession', 'giftVoucher', 'booking'];

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
  perspective: 'raw',
});

const strip = ({ _rev, _updatedAt, ...doc }) => doc;

const docs = await client.fetch('*[_type in $types]', { types: TYPES });
const byId = new Map(docs.map((d) => [d._id, d]));
const toMove = docs.filter((d) => !d._id.includes('.'));

console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'}: ${toMove.length} public document(s) to move`);
let moved = 0;
for (const doc of toMove) {
  const newId = `private.${doc._type}.${doc._id}`;
  const referencedBy = await client.fetch('count(*[references($id)])', { id: doc._id });
  if (referencedBy > 0) {
    console.log(`  SKIP ${doc._type} ${doc._id}: referenced by ${referencedBy} document(s)`);
    continue;
  }
  const draft = byId.get(`drafts.${doc._id}`);
  console.log(`  ${doc._type} ${doc._id} -> ${newId}${draft ? ' (+ draft)' : ''}`);
  if (!APPLY) continue;

  const tx = client.transaction().create({ ...strip(doc), _id: newId }).delete(doc._id);
  if (draft) tx.create({ ...strip(draft), _id: `drafts.${newId}` }).delete(draft._id);
  await tx.commit();
  moved++;
}
console.log(APPLY ? `Done: moved ${moved}.` : 'Nothing changed. Re-run with --apply to move them.');
