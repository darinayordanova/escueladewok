// Remembers that the visitor is done with the newsletter prompt: they closed it, or they
// subscribed from any form. Until then it shows again on every load once the time is reached.
// A UI preference the visitor's own action sets: no cookie consent needed for it.
const STORAGE_KEY = 'woklab:newsletter-prompt';

/** Fired on window when someone subscribes, so an open prompt can step away. */
export const PROMPT_DONE_EVENT = 'woklab:newsletter-done';

export function isPromptDone() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return true; // storage blocked: never nag on every page
  }
}

export function markPromptDone(source?: string) {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    /* storage blocked */
  }
  window.dispatchEvent(new CustomEvent(PROMPT_DONE_EVENT, { detail: { source } }));
}
