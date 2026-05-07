import { auth } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { deleteGmailAccount, getGmailAccounts } from "@/lib/supabase";
import { NextRequest } from "next/server";

// アカウント一覧取得
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "未認証です" }, { status: 401 });
  }

  const ownerEmail = session.ownerEmail ?? session.user.email;
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

// アカウント削除（IDOR 修正：所有者一致を必須化、CSRF 対策付き）
export async function DELETE(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (!csrf.ok) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "未認証です" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }
  const id = (body as { id?: unknown })?.id;
  if (typeof id !== "string" || !/^[0-9a-f-]{8,64}$/i.test(id)) {
    return Response.json({ error: "id が不正です" }, { status: 400 });
  }

  const ownerEmail = session.ownerEmail ?? session.user.email;
  const deleted = await deleteGmailAccount(id, ownerEmail);
  if (!deleted) {
    return Response.json({ error: "アカウントが見つかりません" }, { status: 404 });
  }
  return Response.json({ success: true });
}
