import type { EnquiryDraft } from '@/lib/corporate/draftReply';
import { escapeSlack, postSlackMessage } from '@/lib/slack';

// Slack limits: 3000 characters for a section's text and for a button's URL
const SECTION_MAX = 3000;
const URL_MAX = 3000;

const cut = (text: string, max = SECTION_MAX) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** A Gmail compose window with the reply filled in; CORPORATE_REPLY_MAILBOX picks the Google account. */
function gmailComposeUrl(to: string, subject: string, body: string) {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to, su: subject, body });
  const mailbox = process.env.CORPORATE_REPLY_MAILBOX;
  if (mailbox) params.set('authuser', mailbox);
  return `https://mail.google.com/mail/?${params}`;
}

const mailtoUrl = (to: string, subject: string, body: string) =>
  `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/**
 * Posts a corporate enquiry, with Claude's draft reply when there is one, to the team's Slack channel.
 * Skipped (with a warning) until SLACK_BOT_TOKEN and SLACK_CORPORATE_ENQUIRIES_CHANNEL_ID are set.
 */
export async function postCorporateEnquiryToSlack({
  title,
  rows,
  message,
  email,
  draft,
}: {
  title: string;
  rows: [string, string][];
  message: string;
  email: string;
  draft: EnquiryDraft | null;
}) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channelId = process.env.SLACK_CORPORATE_ENQUIRIES_CHANNEL_ID;
  if (!token || !channelId) {
    console.warn('[corporate-enquiry] Slack not configured, enquiry not posted');
    return;
  }

  const e = escapeSlack;
  const section = (text: string) => ({ type: 'section', text: { type: 'mrkdwn', text: cut(text) } });
  const blocks: unknown[] = [
    { type: 'header', text: { type: 'plain_text', text: cut(`🥢 ${title}`, 150) } },
    section(rows.map(([label, value]) => `*${e(label)}:* ${e(value)}`).join('\n')),
  ];
  if (message) blocks.push(section(`*Their message*\n>${e(message).replace(/\n/g, '\n>')}`));

  if (draft) {
    blocks.push({ type: 'divider' }, section(`*Draft reply* (Claude, check before sending)\n*Subject:* ${e(draft.subject)}`));
    blocks.push(section(`\`\`\`${e(draft.body)}\`\`\``));
    if (draft.translation.trim()) {
      blocks.push(section(`*In English* (for the team, not sent)\n>${e(draft.translation).replace(/\n/g, '\n>')}`));
    }
    if (draft.missing.length) blocks.push(section(`*Still to ask*\n${draft.missing.map((m) => `• ${e(m)}`).join('\n')}`));
    if (draft.teamNotes.length) blocks.push(section(`*Notes*\n${draft.teamNotes.map((n) => `• ${e(n)}`).join('\n')}`));

    const gmail = gmailComposeUrl(email, draft.subject, draft.body);
    const mailto = mailtoUrl(email, draft.subject, draft.body);
    const buttons = [
      gmail.length <= URL_MAX && { type: 'button', text: { type: 'plain_text', text: 'Reply in Gmail' }, url: gmail, style: 'primary' },
      mailto.length <= URL_MAX && { type: 'button', text: { type: 'plain_text', text: 'Reply in mail app' }, url: mailto },
    ].filter(Boolean);
    blocks.push(
      buttons.length
        ? { type: 'actions', elements: buttons }
        : section('_The draft is too long for a reply button: copy it from above._'),
    );
  } else {
    blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: `No draft this time. Reply to ${e(email)} from the inbox.` }] });
  }

  await postSlackMessage({ token, channelId, text: title, blocks });
}
