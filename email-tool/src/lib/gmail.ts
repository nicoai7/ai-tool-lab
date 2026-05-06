import { google } from "googleapis";

export interface RawEmail {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  isUnread: boolean;
}

export async function fetchRecentEmails(
  accessToken: string,
  afterTimestamp?: number,
  beforeTimestamp?: number
): Promise<RawEmail[]> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const after = afterTimestamp ?? Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  let q = `after:${after} in:inbox`;
  if (beforeTimestamp) {
    q += ` before:${beforeTimestamp}`;
  }

  const res = await gmail.users.messages.list({
    userId: "me",
    q,
    maxResults: 50,
  });

  const messages = res.data.messages || [];
  const emails: RawEmail[] = [];

  for (const msg of messages) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });

    const headers = detail.data.payload?.headers || [];
    const from =
      headers.find((h) => h.name === "From")?.value || "不明な送信者";
    const subject =
      headers.find((h) => h.name === "Subject")?.value || "(件名なし)";
    const date =
      headers.find((h) => h.name === "Date")?.value ||
      new Date().toISOString();

    const isUnread =
      detail.data.labelIds?.includes("UNREAD") || false;

    // 本文を取得（プレーンテキスト優先）
    let body = "";
    const payload = detail.data.payload;
    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, "base64").toString("utf-8");
    } else if (payload?.parts) {
      const textPart = payload.parts.find(
        (p) => p.mimeType === "text/plain"
      );
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      } else {
        const htmlPart = payload.parts.find(
          (p) => p.mimeType === "text/html"
        );
        if (htmlPart?.body?.data) {
          body = Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
          body = body.replace(/<[^>]*>/g, ""); // HTMLタグ除去
        }
      }
    }

    // 本文は先頭500文字に制限（API費用節約）
    body = body.slice(0, 500).trim();

    emails.push({ id: msg.id!, from, subject, body, date, isUnread });
  }

  return emails;
}
