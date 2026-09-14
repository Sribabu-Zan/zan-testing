/**
 * The chat token, kept in localStorage so a visitor who opens the panel again
 * — or comes back tomorrow — resumes the same thread rather than stranding an
 * agent mid-conversation.
 *
 * The key is the main app's, on purpose: once this page is served from the
 * same origin, a thread started here continues on the service pages.
 *
 * Every accessor is guarded. Safari private mode throws on localStorage rather
 * than returning null, and an unguarded read there would break the panel.
 */
const KEY = "zan.chat.token";

export function readToken(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string): void {
  try {
    window.localStorage.setItem(KEY, token);
  } catch {
    /* Private mode. The conversation still works, it just will not resume. */
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
