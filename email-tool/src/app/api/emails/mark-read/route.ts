import { resolveAccessToken } from "@/lib/resolve-token";
import { GmailAuthError, GmailRateLimitError } from "@/lib/gmail";
import { assertSameOrigin } from "@/lib/csrf";
import { google } from "googleapis";
import { NextRequest } from "next/server";

const MAX_IDS = 200;
const ID_PATTERN = /^[A-Za-z0-9_-]{8,}$/;

export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (!csrf.ok) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }
  const { messageIds, accountId } = body as { messageIds?: unknown; accountId?: unknown };

  if (typeof accountId !== "string" || !accountId) {
    return Response.json({ error: "accountId が必要です" }, { status: 400 });
  }
  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return Response.json({ error: "メールIDが必要です" }, { status: 400 });
  }
  if (messageIds.length > MAX_IDS) {
    return Response.json({ error: `上限 ${MAX_IDS} 件まで` }, { status: 400 });
  }
  if (!messageIds.every((m) => typeof m === "string" && ID_PATTERN.test(m))) {
    return Response.json({ error: "messageIds の形式が不正です" }, { status: 400 });
  }

  const result = await resolveAccessToken(accountId);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: result.token });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    // batchModify は ID リストの一つでも見つからないと全滅するため、個別 modify を allSettled で。
    const settled = await Promise.allSettled(
      messageIds.map((id) =>
        gmail.users.messages.modify({
          userId: "me",
          id: id as string,
          requestBody: { removeLabelIds: ["UNREAD"] },
        }),
      ),
    );
    const succeeded = settled.filter((s) => s.status === "fulfilled").length;
    const failedIds = messageIds.filter((_, i) => settled[i].status === "rejected") as string[];
    return Response.json({ success: failedIds.length === 0, count: succeeded, failedIds });
  } catch (e) {
    if (e instanceof GmailAuthError) {
      return Response.json({ error: "Gmail 認証が切れました" }, { status: 401 });
    }
    if (e instanceof GmailRateLimitError) {
      return Response.json({ error: "Gmail のレート制限" }, { status: 429 });
    }
    console.error("既読処理エラー:", (e as Error).message);
    return Response.json({ error: "既読処理に失敗しました" }, { status: 500 });
  }
}
