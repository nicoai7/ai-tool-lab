import { resolveAccessToken } from "@/lib/resolve-token";
import { google } from "googleapis";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { messageIds, accountId } = await request.json();

  const result = await resolveAccessToken(accountId);
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return Response.json({ error: "メールIDが必要です" }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: result.token });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    await gmail.users.messages.batchModify({
      userId: "me",
      requestBody: {
        ids: messageIds,
        removeLabelIds: ["UNREAD"],
      },
    });

    return Response.json({ success: true, count: messageIds.length });
  } catch (error: any) {
    console.error("既読処理エラー:", error);
    return Response.json({ error: "既読処理に失敗しました" }, { status: 500 });
  }
}
