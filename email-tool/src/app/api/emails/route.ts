import { resolveAccessToken } from "@/lib/resolve-token";
import { fetchRecentEmails } from "@/lib/gmail";
import { analyzeEmails } from "@/lib/analyzer";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accountId = searchParams.get("accountId");

  const result = await resolveAccessToken(accountId);
  if (result.error) {
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

  try {
    const rawEmails = await fetchRecentEmails(result.token!, afterTimestamp, beforeTimestamp);
    const analyzed = await analyzeEmails(rawEmails);

    const order = { urgent: 0, today: 1, info: 2, skip: 3 };
    analyzed.sort((a, b) => order[a.priority] - order[b.priority]);

    const counts = {
      total: analyzed.length,
      urgent: analyzed.filter((e) => e.priority === "urgent").length,
      today: analyzed.filter((e) => e.priority === "today").length,
      info: analyzed.filter((e) => e.priority === "info").length,
      skip: analyzed.filter((e) => e.priority === "skip").length,
    };

    return Response.json({ emails: analyzed, counts });
  } catch (error: any) {
    console.error("メール取得エラー:", error);
    return Response.json({ error: "メールの取得に失敗しました" }, { status: 500 });
  }
}
