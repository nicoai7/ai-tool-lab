import { auth } from "@/lib/auth";
import { getGmailAccounts } from "@/lib/supabase";
import { fetchRecentEmails, RawEmail, GmailAuthError, GmailRateLimitError } from "@/lib/gmail";
import { analyzeEmails } from "@/lib/analyzer";
import { ensureFreshToken } from "@/lib/resolve-token";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "未認証です" }, { status: 401 });
  }

  const ownerEmail = session.ownerEmail ?? session.user.email;
  const allAccounts = await getGmailAccounts(ownerEmail);
  if (allAccounts.length === 0) {
    return Response.json({ error: "アカウントが登録されていません" }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;

  const accountIdsParam = searchParams.get("accountIds");
  const accountIds = accountIdsParam
    ? accountIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : null;
  const accounts = accountIds
    ? allAccounts.filter((a) => accountIds.includes(a.id))
    : allAccounts;
  if (accounts.length === 0) {
    return Response.json({ error: "対象アカウントがありません" }, { status: 400 });
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
    type EnrichedEmail = RawEmail & { accountEmail: string; accountId: string };
    const skippedAccounts: string[] = [];

    const perAccount = await Promise.all(
      accounts.map(async (account): Promise<EnrichedEmail[]> => {
        const token = await ensureFreshToken(account);
        if (!token) {
          skippedAccounts.push(account.gmail_email);
          return [];
        }
        try {
          const emails = await fetchRecentEmails(token, { afterTimestamp, beforeTimestamp });
          return emails.map((e) => ({
            ...e,
            accountEmail: account.gmail_email,
            accountId: account.id,
          }));
        } catch (e) {
          if (e instanceof GmailAuthError) {
            skippedAccounts.push(`${account.gmail_email} (auth)`);
            return [];
          }
          if (e instanceof GmailRateLimitError) {
            skippedAccounts.push(`${account.gmail_email} (rate limit)`);
            return [];
          }
          console.error(`${account.gmail_email} のメール取得エラー:`, (e as Error).message);
          return [];
        }
      }),
    );

    const allEmails = perAccount.flat();
    const analyzed = await analyzeEmails(allEmails);

    // analyzeEmails は入力順を保つので index で結合（N×N 解消）
    const withAccount = analyzed.map((email, i) => {
      const raw = allEmails[i];
      return {
        ...email,
        accountEmail: raw?.accountEmail ?? "",
        accountId: raw?.accountId ?? "",
      };
    });

    const order = { urgent: 0, today: 1, info: 2, skip: 3 };
    withAccount.sort((a, b) => order[a.priority] - order[b.priority]);

    const counts = {
      total: withAccount.length,
      urgent: withAccount.filter((e) => e.priority === "urgent").length,
      today: withAccount.filter((e) => e.priority === "today").length,
      info: withAccount.filter((e) => e.priority === "info").length,
      skip: withAccount.filter((e) => e.priority === "skip").length,
    };

    return Response.json({ emails: withAccount, counts, skippedAccounts });
  } catch (e) {
    console.error("統合メール取得エラー:", (e as Error).message);
    return Response.json({ error: "メールの取得に失敗しました" }, { status: 500 });
  }
}
