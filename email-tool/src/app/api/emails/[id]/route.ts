import { resolveAccessToken } from "@/lib/resolve-token";
import { google } from "googleapis";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const accountId = request.nextUrl.searchParams.get("accountId");
  const result = await resolveAccessToken(accountId);
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const { id } = await params;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: result.token });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "full",
    });

    const headers = detail.data.payload?.headers || [];
    const from = headers.find((h) => h.name === "From")?.value || "";
    const to = headers.find((h) => h.name === "To")?.value || "";
    const subject = headers.find((h) => h.name === "Subject")?.value || "";
    const date = headers.find((h) => h.name === "Date")?.value || "";
    const cc = headers.find((h) => h.name === "Cc")?.value || "";

    let textBody = "";
    let htmlBody = "";

    function extractBody(payload: any) {
      if (!payload) return;
      if (payload.mimeType === "text/plain" && payload.body?.data) {
        textBody = Buffer.from(payload.body.data, "base64").toString("utf-8");
      }
      if (payload.mimeType === "text/html" && payload.body?.data) {
        htmlBody = Buffer.from(payload.body.data, "base64").toString("utf-8");
      }
      if (payload.parts) {
        for (const part of payload.parts) {
          extractBody(part);
        }
      }
    }
    extractBody(detail.data.payload);

    const attachments: { filename: string; mimeType: string; size: number }[] = [];
    function extractAttachments(payload: any) {
      if (!payload) return;
      if (payload.filename && payload.body?.attachmentId) {
        attachments.push({
          filename: payload.filename,
          mimeType: payload.mimeType || "",
          size: payload.body.size || 0,
        });
      }
      if (payload.parts) {
        for (const part of payload.parts) {
          extractAttachments(part);
        }
      }
    }
    extractAttachments(detail.data.payload);

    return Response.json({ id, from, to, cc, subject, date, textBody, htmlBody, attachments });
  } catch (error: any) {
    console.error("メール詳細取得エラー:", error);
    return Response.json({ error: "メールの取得に失敗しました" }, { status: 500 });
  }
}
