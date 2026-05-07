import { google } from "googleapis";
import { auth } from "./auth";
import { GmailAccount, getGmailAccountByIdForOwner, updateAccessToken } from "./supabase";

interface RefreshResult {
  accessToken: string;
  expiresAt: number; // unix seconds
  refreshToken?: string;
}

async function refreshAccessToken(refreshToken: string): Promise<RefreshResult | null> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    if (!credentials.access_token) return null;
    const expiryMs = credentials.expiry_date ?? Date.now() + 60 * 50 * 1000; // fallback ~50min
    return {
      accessToken: credentials.access_token,
      expiresAt: Math.floor(expiryMs / 1000),
      refreshToken: credentials.refresh_token ?? undefined,
    };
  } catch {
    return null;
  }
}

// アカウントが期限切れなら refresh_token で更新し、DB にも反映する。
// 戻り値は最新の access_token。リフレッシュ失敗時は null。
export async function ensureFreshToken(account: GmailAccount): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  const isExpired = account.expires_at !== null && account.expires_at < now + 30; // 30秒バッファ
  if (!isExpired) return account.access_token;
  if (!account.refresh_token) return null;

  const refreshed = await refreshAccessToken(account.refresh_token);
  if (!refreshed) return null;

  await updateAccessToken(
    account.id,
    refreshed.accessToken,
    refreshed.expiresAt,
    refreshed.refreshToken ?? null,
  );
  return refreshed.accessToken;
}

export type ResolveResult =
  | { ok: true; token: string; account: GmailAccount }
  | { ok: false; error: string; status: number };

// accountId が必須。所有者一致を確認してトークンを返す（IDOR ガード込み）。
export async function resolveAccessToken(accountId: string | null | undefined): Promise<ResolveResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false, error: "未認証です", status: 401 };
  }

  if (!accountId) {
    return { ok: false, error: "accountId が必要です", status: 400 };
  }

  const ownerEmail = session.ownerEmail ?? session.user.email;
  const account = await getGmailAccountByIdForOwner(accountId, ownerEmail);
  if (!account) {
    return { ok: false, error: "アカウントが見つかりません", status: 404 };
  }

  const token = await ensureFreshToken(account);
  if (!token) {
    return { ok: false, error: "トークンの更新に失敗しました", status: 401 };
  }
  return { ok: true, token, account };
}

// セッションが返すべき「現在の owner メール」（フォールバック撤廃版）
export async function getOwnerEmail(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  // ownerEmail が JWT に無い時はメールアドレスをオーナーとして扱う（初回ログイン直後のみ発生し得る）
  return session.ownerEmail ?? session.user.email;
}
