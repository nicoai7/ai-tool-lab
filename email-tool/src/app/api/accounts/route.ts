import { auth } from "@/lib/auth";
import { getGmailAccounts, deleteGmailAccount } from "@/lib/supabase";
import { NextRequest } from "next/server";

// アカウント一覧取得
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "未認証です" }, { status: 401 });
  }

  const ownerEmail = (session as any).ownerEmail || session.user.email;
  const accounts = await getGmailAccounts(ownerEmail);
  // トークンは返さない
  const safe = accounts.map((a) => ({
    id: a.id,
    gmail_email: a.gmail_email,
    account_name: a.account_name,
    created_at: a.created_at,
  }));

  return Response.json({ accounts: safe });
}

// アカウント削除
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "未認証です" }, { status: 401 });
  }

  const { id } = await request.json();
  await deleteGmailAccount(id);
  return Response.json({ success: true });
}
