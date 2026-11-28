// Slack Web API over fetch — a bot token (xoxb-…) with chat:write and files:write.
// The bot must be a member of every channel it posts to.

const SLACK_API = 'https://slack.com/api';

/** Escapes text for Slack mrkdwn. */
export function escapeSlack(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function slackCall<T>(method: string, token: string, init: { form?: Record<string, string>; json?: unknown }): Promise<T> {
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': init.json ? 'application/json; charset=utf-8' : 'application/x-www-form-urlencoded',
    },
    body: init.json ? JSON.stringify(init.json) : new URLSearchParams(init.form),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack ${method} failed: ${data.error}`);
  return data as T;
}

/** Posts a file to a channel with a message above it (Slack's two-step external upload). */
export async function postSlackFile({
  token,
  channelId,
  filename,
  title,
  content,
  message,
}: {
  token: string;
  channelId: string;
  filename: string;
  title: string;
  content: Buffer;
  message: string;
}) {
  const { upload_url, file_id } = await slackCall<{ upload_url: string; file_id: string }>('files.getUploadURLExternal', token, {
    form: { filename, length: String(content.byteLength) },
  });

  const upload = await fetch(upload_url, { method: 'POST', body: new Uint8Array(content) });
  if (!upload.ok) throw new Error(`Slack file upload failed: ${upload.status}`);

  await slackCall('files.completeUploadExternal', token, {
    json: { files: [{ id: file_id, title }], channel_id: channelId, initial_comment: message },
  });
}

/** Posts a message to a channel: `text` is the notification fallback, `blocks` what Slack shows. */
export async function postSlackMessage({
  token,
  channelId,
  text,
  blocks,
}: {
  token: string;
  channelId: string;
  text: string;
  blocks?: unknown[];
}) {
  await slackCall('chat.postMessage', token, { json: { channel: channelId, text, blocks, unfurl_links: false } });
}
