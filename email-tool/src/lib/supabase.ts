import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// アカウント一覧取得
export async function getGmailAccounts(
  userEmail: string
): Promise<GmailAccount[]> {
  const { data, error } = await supabaseAdmin
    .from("gmail_accounts")
    .select("*")
    .eq("user_email", userEmail)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// アカウント追加・更新（upsert）
export async function upsertGmailAccount(params: {
  userEmail: string;
  gmailEmail: string;
  accountName?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}) {
  const { error } = await supabaseAdmin.from("gmail_accounts").upsert(
    {
      user_email: params.userEmail,
      gmail_email: params.gmailEmail,
      account_name: params.accountName || params.gmailEmail,
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      expires_at: params.expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_email,gmail_email" }
  );

  if (error) throw error;
}

// アカウント削除
export async function deleteGmailAccount(id: string) {
  const { error } = await supabaseAdmin
    .from("gmail_accounts")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// トークン更新
export async function updateAccessToken(
  id: string,
  accessToken: string,
  expiresAt?: number
) {
  const { error } = await supabaseAdmin
    .from("gmail_accounts")
    .update({
      access_token: accessToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}
