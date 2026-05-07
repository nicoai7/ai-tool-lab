import { resolveAccessToken } from "@/lib/resolve-token";
import { GmailAuthError, GmailRateLimitError } from "@/lib/gmail";
import { google, gmail_v1 } from "googleapis";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accountId = request.nextUrl.searchParams.get("accountId");
  const result = await resolveAccessToken(accountId);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{8,}$/.test(id)) {
    return Response.json({ error: "id が不正です" }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: result.token });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "full",
    });

    const headers = detail.data.payload?.headers ?? [];
    const from = headers.find((h) => h.name === "From")?.value ?? "";
    const to = headers.find((h) => h.name === "To")?.value ?? "";
    const subject = headers.find((h) => h.name === "Subject")?.value ?? "";
    const date = headers.find((h) => h.name === "Date")?.value ?? "";
    const cc = headers.find((h) => h.name === "Cc")?.value ?? "";

    let textBody = "";
    let htmlBody = "";

    function extractBody(payload: gmail_v1.Schema$MessagePart | undefined) {
      if (!payload) return;
      if (payload.mimeType === "text/plain" && payload.body?.data) {
        textBody = Buffer.from(payload.body.data, "base64").toString("utf-8");
      }
      if (payload.mimeType === "text/html" && payload.body?.data) {
        htmlBody = Buffer.from(payload.body.data, "base64").toString("utf-8");
      }
      if (payload.parts) {
        for (const part of payload.parts) extractBody(part);
      }
    }
    extractBody(detail.data.payload ?? undefined);

    const attachments: { filename: string; mimeType: string; size: number }[] = [];
    function extractAttachments(payload: gmail_v1.Schema$MessagePart | undefined) {
      if (!payload) return;
      if (payload.filename && payload.body?.attachmentId) {
        attachments.push({
          filename: payload.filename,
          mimeType: payload.mimeType ?? "",
          size: payload.body.size ?? 0,
        });
      }
      if (payload.parts) {
        for (const part of payload.parts) extractAttachments(part);
      }
    }
    extractAttachments(detail.data.payload ?? undefined);

    return Response.json({ id, from, to, cc, subject, date, textBody, htmlBody, attachments });
  } catch (e) {
    if (e instanceof GmailAuthError) {
      return Response.json({ error: "Gmail 認証が切れました" }, { status: 401 });
    }
    if (e instanceof GmailRateLimitError) {
      return Response.json({ error: "Gmail のレート制限に達しました" }, { status: 429 });
    }
    // googleapis 由来の 404 を 404 のまま返す
    const code = (e as { code?: number; status?: number }).code ?? (e as { status?: number }).status;
    if (code === 404) {
      return Response.json({ error: "メールが見つかりません" }, { status: 404 });
    }
    console.error("メール詳細取得エラー:", (e as Error).message);
    return Response.json({ error: "メールの取得に失敗しました" }, { status: 500 });
  }
}
