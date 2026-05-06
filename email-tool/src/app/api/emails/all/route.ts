import { auth } from "@/lib/auth";
import { getGmailAccounts, supabaseAdmin } from "@/lib/supabase";
import { fetchRecentEmails, RawEmail } from "@/lib/gmail";
import { analyzeEmails } from "@/lib/analyzer";
import { google } from "googleapis";
import { NextRequest } from "next/server";

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials.access_token || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "未認証です" }, { status: 401 });
  }

  const ownerEmail = (session as any).ownerEmail || session.user.email;
  const allAccounts = await getGmailAccounts(ownerEmail);
  if (allAccounts.length === 0) {
    return Response.json({ error: "アカウントが登録されていません" }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;

  // 指定されたaccountIdsでフィルター
  const accountIdsParam = searchParams.get("accountIds");
  const accountIds = accountIdsParam ? accountIdsParam.split(",") : null;
  const accounts = accountIds
    ? allAccounts.filter((a) => accountIds.includes(a.id))
    : allAccounts;
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
    // 全アカウントから並列でメール取得
    const allEmails: (RawEmail & { accountEmail: string; accountId: string })[] = [];

    await Promise.all(
      accounts.map(async (account) => {
        let token = account.access_token;

        // トークン期限切れチェック
        const now = Math.floor(Date.now() / 1000);
        if (account.expires_at && account.expires_at < now && account.refresh_token) {
          const newToken = await refreshAccessToken(account.refresh_token);
          if (newToken) {
            token = newToken;
            await supabaseAdmin
              .from("gmail_accounts")
              .update({ access_token: newToken, updated_at: new Date().toISOString() })
              .eq("id", account.id);
          } else {
            return; // このアカウントはスキップ
          }
        }

        try {
          const emails = await fetchRecentEmails(token, afterTimestamp, beforeTimestamp);
          for (const email of emails) {
            allEmails.push({
              ...email,
              accountEmail: account.gmail_email,
              accountId: account.id,
            });
          }
        } catch (e) {
          console.error(`${account.gmail_email} のメール取得エラー:`, e);
        }
      })
    );

    const analyzed = await analyzeEmails(allEmails);

    // accountEmail情報を付与
    const withAccount = analyzed.map((email, i) => {
      const raw = allEmails.find((r) => r.id === email.id);
      return {
        ...email,
        accountEmail: raw?.accountEmail || "",
        accountId: raw?.accountId || "",
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

    return Response.json({ emails: withAccount, counts });
  } catch (error: any) {
    console.error("統合メール取得エラー:", error);
    return Response.json({ error: "メールの取得に失敗しました" }, { status: 500 });
  }
}
