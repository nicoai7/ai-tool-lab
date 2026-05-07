import { createClient } from "@supabase/supabase-js";
import { decryptStringIfEncrypted, encryptString, isEncrypted } from "./crypto";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// DB スキーマ（暗号化文字列を保持し得る）
interface GmailAccountRow {
  id: string;
  user_email: string;
  gmail_email: string;
  account_name: string | null;
  access_token: string;
  refresh_token: string | null;
  expires_at: number | null;
  created_at: string;
  updated_at: string;
}

// アプリ層が扱う型（access_token / refresh_token は復号済み）
export interface GmailAccount {
  id: string;
  user_email: string;
  gmail_email: string;
  account_name: string | null;
  access_token: string;
  refresh_token: string | null;
  expires_at: number | null;
  created_at: string;
  updated_at: string;
}

async function decryptRow(row: GmailAccountRow): Promise<GmailAccount> {
  const access_token = (await decryptStringIfEncrypted(row.access_token)) ?? "";
  const refresh_token = await decryptStringIfEncrypted(row.refresh_token);
  return {
    ...row,
    access_token,
    refresh_token,
  };
}

// 平文で読み込まれたトークンは次回保存タイミングで暗号化に置き換える（lazy migration）。
async function maybeMigratePlaintext(row: GmailAccountRow) {
  const updates: Record<string, string | null> = {};
  if (row.access_token && !isEncrypted(row.access_token)) {
    updates.access_token = await encryptString(row.access_token);
  }
  if (row.refresh_token && !isEncrypted(row.refresh_token)) {
    updates.refresh_token = await encryptString(row.refresh_token);
  }
  if (Object.keys(updates).length === 0) return;
  await supabaseAdmin.from("gmail_accounts").update(updates).eq("id", row.id);
}

export async function getGmailAccounts(userEmail: string): Promise<GmailAccount[]> {
  const { data, error } = await supabaseAdmin
    .from("gmail_accounts")
    .select("*")
    .eq("user_email", userEmail)
    .order("created_at", { ascending: true });

  if (error) throw error;
  const rows = (data || []) as GmailAccountRow[];

  // 平文値が混在している場合は次回参照のために暗号化に書き換える（fire-and-forget）
  for (const row of rows) {
    if (
      (row.access_token && !isEncrypted(row.access_token)) ||
      (row.refresh_token && !isEncrypted(row.refresh_token))
    ) {
      void maybeMigratePlaintext(row);
    }
  }

  return Promise.all(rows.map(decryptRow));
}

// 所有者一致を強制したヘルパ（IDOR ガード）
export async function getGmailAccountByIdForOwner(
  id: string,
  ownerEmail: string,
): Promise<GmailAccount | null> {
  const { data, error } = await supabaseAdmin
    .from("gmail_accounts")
    .select("*")
    .eq("id", id)
    .eq("user_email", ownerEmail)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const row = data as GmailAccountRow;
  if (
    (row.access_token && !isEncrypted(row.access_token)) ||
    (row.refresh_token && !isEncrypted(row.refresh_token))
  ) {
    void maybeMigratePlaintext(row);
  }
  return decryptRow(row);
}

export async function upsertGmailAccount(params: {
  userEmail: string;
  gmailEmail: string;
  accountName?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}) {
  const accessToken = await encryptString(params.accessToken);
  const refreshToken = params.refreshToken ? await encryptString(params.refreshToken) : null;
  const { error } = await supabaseAdmin.from("gmail_accounts").upsert(
    {
      user_email: params.userEmail,
      gmail_email: params.gmailEmail,
      account_name: params.accountName || params.gmailEmail,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: params.expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_email,gmail_email" },
  );

  if (error) throw error;
}

// 所有者一致を必須化（IDOR fix）
export async function deleteGmailAccount(id: string, ownerEmail: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("gmail_accounts")
    .delete()
    .eq("id", id)
    .eq("user_email", ownerEmail)
    .select("id");

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// トークン更新（所有者一致前提・呼び元で確認済みの id だけを渡すこと）
export async function updateAccessToken(
  id: string,
  accessToken: string,
  expiresAt?: number,
  refreshToken?: string | null,
) {
  const update: Record<string, unknown> = {
    access_token: await encryptString(accessToken),
    updated_at: new Date().toISOString(),
  };
  if (expiresAt !== undefined) update.expires_at = expiresAt;
  if (refreshToken) update.refresh_token = await encryptString(refreshToken);

  const { error } = await supabaseAdmin
    .from("gmail_accounts")
    .update(update)
    .eq("id", id);

  if (error) throw error;
}
