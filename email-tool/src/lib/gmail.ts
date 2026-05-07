import { google, gmail_v1 } from "googleapis";

export interface RawEmail {
  id: string;
  from: string;
  subject: string;
  body: string; // 一覧用は空文字。本文は詳細取得 (`/api/emails/[id]`) で別途取得する
  date: string;
  isUnread: boolean;
}

export class GmailRateLimitError extends Error {
  constructor(message = "Gmail rate limit exceeded") {
    super(message);
    this.name = "GmailRateLimitError";
  }
}

export class GmailAuthError extends Error {
  constructor(message = "Gmail authentication failed") {
    super(message);
    this.name = "GmailAuthError";
  }
}

interface GapiError {
  code?: number;
  status?: number;
  errors?: { reason?: string }[];
  message?: string;
}

function isGapiError(e: unknown): e is GapiError {
  return typeof e === "object" && e !== null && ("code" in e || "errors" in e);
}

function classifyError(e: unknown): Error {
  if (isGapiError(e)) {
    const code = e.code ?? e.status;
    if (code === 401 || code === 403) return new GmailAuthError(e.message ?? "auth");
    if (code === 429 || (e.errors ?? []).some((err) => err.reason === "rateLimitExceeded" || err.reason === "userRateLimitExceeded")) {
      return new GmailRateLimitError(e.message ?? "rate_limit");
    }
  }
  return e instanceof Error ? e : new Error(String(e));
}

const MAX_PAGES = 4; // 50 × 4 = 最大 200 通
const PAGE_SIZE = 50;
const PARALLEL_LIMIT = 10;

export interface FetchOptions {
  afterTimestamp?: number;
  beforeTimestamp?: number;
  limit?: number; // 上限（既定 200）
}

// 並列度を制限した Promise.all 風の実行
async function pMap<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

export async function fetchRecentEmails(
  accessToken: string,
  optsOrAfter?: FetchOptions | number,
  legacyBefore?: number,
): Promise<RawEmail[]> {
  // 後方互換: 旧シグネチャ (accessToken, afterTs, beforeTs)
  const opts: FetchOptions = typeof optsOrAfter === "number" || optsOrAfter === undefined
    ? { afterTimestamp: optsOrAfter as number | undefined, beforeTimestamp: legacyBefore }
    : optsOrAfter;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const after = opts.afterTimestamp ?? Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  let q = `after:${after} in:inbox`;
  if (opts.beforeTimestamp) q += ` before:${opts.beforeTimestamp}`;

  const limit = opts.limit ?? PAGE_SIZE * MAX_PAGES;

  // 1. メッセージ ID を pageToken でループして集める（最大 limit 件）
  const messageIds: string[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES && messageIds.length < limit; page++) {
    let res;
    try {
      res = await gmail.users.messages.list({
        userId: "me",
        q,
        maxResults: Math.min(PAGE_SIZE, limit - messageIds.length),
        pageToken,
      });
    } catch (e) {
      throw classifyError(e);
    }
    for (const m of res.data.messages ?? []) {
      if (m.id) messageIds.push(m.id);
    }
    pageToken = res.data.nextPageToken ?? undefined;
    if (!pageToken) break;
  }

  if (messageIds.length === 0) return [];

  // 2. 並列で metadata だけ取得（本文は別途）。404 (削除) は静かにスキップ。
  const results = await pMap(messageIds, PARALLEL_LIMIT, async (id) => {
    try {
      return await gmail.users.messages.get({
        userId: "me",
        id,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });
    } catch (e) {
      const err = classifyError(e);
      if (err instanceof GmailAuthError || err instanceof GmailRateLimitError) throw err;
      // 404 や個別失敗は null で握り潰し、後段でフィルタ
      return null;
    }
  });

  const emails: RawEmail[] = [];
  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    if (!res) continue;
    const detail = res.data as gmail_v1.Schema$Message;
    const headers = detail.payload?.headers ?? [];
    const from = headers.find((h) => h.name === "From")?.value ?? "不明な送信者";
    const subject = headers.find((h) => h.name === "Subject")?.value ?? "(件名なし)";
    const date = headers.find((h) => h.name === "Date")?.value ?? new Date().toISOString();
    const isUnread = detail.labelIds?.includes("UNREAD") ?? false;
    emails.push({
      id: messageIds[i],
      from,
      subject,
      body: detail.snippet ?? "", // 一覧用には snippet（〜200文字）で十分
      date,
      isUnread,
    });
  }

  return emails;
}
