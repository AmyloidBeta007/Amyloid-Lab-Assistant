/**
 * Gmail Service for Amyloid Lab Assistant
 * Enables drafting and sending scientific syntheses directly via Gmail REST API v1.
 * Complies with least privilege scopes:
 * - https://www.googleapis.com/auth/gmail.send
 * - https://www.googleapis.com/auth/gmail.compose
 */

export interface GmailSendPayload {
  to: string;
  subject: string;
  bodyText: string;
  fromName?: string;
}

export interface GmailSendResult {
  id: string;
  threadId: string;
  labelIds?: string[];
  isDraft?: boolean;
}

/**
 * Base64url encoder according to RFC 4648 Section 5
 */
function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Formats an RFC 2822 email message with proper UTF-8 subject and body
 */
function buildRfc2822Raw(payload: GmailSendPayload): string {
  // RFC 2047 encoded-word for UTF-8 subject line
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`;

  const lines = [
    `To: ${payload.to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    payload.bodyText
  ];

  return utf8ToBase64Url(lines.join('\r\n'));
}

/**
 * Dispatches an email immediately through the Gmail REST API
 * (Mutating operation - Requires user confirmation in UI before calling)
 */
export async function sendEmailViaGmail(
  payload: GmailSendPayload,
  accessToken: string
): Promise<GmailSendResult> {
  const raw = buildRfc2822Raw(payload);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData?.error?.message ||
      `Gmail API returned HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  const data = await response.json();
  return {
    id: data.id,
    threadId: data.threadId,
    labelIds: data.labelIds,
    isDraft: false
  };
}

/**
 * Creates a saved draft in the user's Gmail mailbox
 */
export async function createGmailDraft(
  payload: GmailSendPayload,
  accessToken: string
): Promise<GmailSendResult> {
  const raw = buildRfc2822Raw(payload);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: { raw }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData?.error?.message ||
      `Gmail Draft API returned HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  const data = await response.json();
  return {
    id: data.id,
    threadId: data.message?.threadId || data.id,
    isDraft: true
  };
}
