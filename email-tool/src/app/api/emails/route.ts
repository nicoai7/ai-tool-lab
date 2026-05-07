import { resolveAccessToken } from "@/lib/resolve-token";
import { fetchRecentEmails, GmailAuthError, GmailRateLimitError } from "@/lib/gmail";
import { analyzeEmails } from "@/lib/analyzer";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accountId = searchParams.get("accountId");

  const result = await resolveAccessToken(accountId);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const hoursParam = searchParams.get("hours");
  const sinceParam = searchParams.get("since");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  let afterTimestamp: number;
  let beforeTimestamp: number | undefined;

  if (sinceParam) {
    afterTimestamp = Math.floor(new Date(sinceParam).getTime() / 1000);
  } else if (fromParam) {
    afterTimestamp = Math.floor(new Date(fromParam).getTime() / 1000);
    if (toParam) {
      const toDate = new Date(toParam);
      toDate.setDate(toDate.getDate() + 1);
      beforeTimestamp = Math.floor(toDate.getTime() / 1000);
    }
  } else {
    const hours = hoursParam ? parseInt(hoursParam, 10) : 24;
    afterTimestamp = Math.floor((Date.now() - hours * 60 * 60 * 1000) / 1000);
  }

  if (!Number.isFinite(afterTimestamp) || (beforeTimestamp !== undefined && beforeTimestamp <= afterTimestamp)) {
    return Response.json({ error: "期間指定が不正です" }, { status: 400 });
  }

  try {
    const rawEmails = await fetchRecentEmails(result.token, { afterTimestamp, beforeTimestamp });
    const analyzed = await analyzeEmails(rawEmails);

    const order = { urgent: 0, today: 1, info: 2, skip: 3 };
    analyzed.sort((a, b) => order[a.priority] - order[b.priority]);

    // 取得結果に accountId を付与（フロントの mark-read グルーピング用）
    const withAccount = analyzed.map((e) => ({ ...e, accountId: accountId ?? "" }));

    const counts = {
      total: withAccount.length,
      urgent: withAccount.filter((e) => e.priority === "urgent").length,
      today: withAccount.filter((e) => e.priority === "today").length,
      info: withAccount.filter((e) => e.priority === "info").length,
      skip: withAccount.filter((e) => e.priority === "skip").length,
    };

    return Response.json({ emails: withAccount, counts });
  } catch (e) {
    if (e instanceof GmailAuthError) {
      return Response.json({ error: "Gmail 認証が切れました。アカウントを再連携してください" }, { status: 401 });
    }
    if (e instanceof GmailRateLimitError) {
      return Response.json({ error: "Gmail のレート制限に達しました。しばらく待ってから再試行してください" }, { status: 429 });
    }
    console.error("メール取得エラー:", (e as Error).message);
    return Response.json({ error: "メールの取得に失敗しました" }, { status: 500 });
  }
}
