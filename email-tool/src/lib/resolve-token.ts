import { auth } from "./auth";
import { getGmailAccounts, supabaseAdmin } from "./supabase";
import { google } from "googleapis";

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

export async function resolveAccessToken(
  accountId?: string | null
): Promise<{ token: string; error?: never } | { token?: never; error: string; status: number }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "未認証です", status: 401 };
  }

  if (accountId) {
    const ownerEmail = (session as any).ownerEmail || session.user.email;
    const accounts = await getGmailAccounts(ownerEmail);
    const account = accounts.find((a) => a.id === accountId);
    if (!account) {
      return { error: "アカウントが見つかりません", status: 404 };
    }

    const now = Math.floor(Date.now() / 1000);
    if (account.expires_at && account.expires_at < now && account.refresh_token) {
      const newToken = await refreshAccessToken(account.refresh_token);
      if (newToken) {
        await supabaseAdmin
          .from("gmail_accounts")
          .update({ access_token: newToken, updated_at: new Date().toISOString() })
          .eq("id", accountId);
        return { token: newToken };
      }
      return { error: "トークンの更新に失敗しました", status: 401 };
    }
    return { token: account.access_token };
  }

  const token = (session as any).accessToken;
  if (!token) {
    return { error: "Gmailへのアクセス権がありません", status: 403 };
  }
  return { token };
}
