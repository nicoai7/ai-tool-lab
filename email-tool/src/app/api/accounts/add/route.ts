import { signIn } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { NextRequest } from "next/server";

// アカウント追加（OAuth 開始）。POST 必須にすることで <img> 経由の CSRF 起動を防ぐ。
// クライアントは AccountSelector で <form method="post"> から呼び出す。
export async function POST(request: NextRequest) {
  const csrf = assertSameOrigin(request);
  if (!csrf.ok) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  // signIn は内部で next/navigation の redirect() を投げる
  return signIn("google", { redirectTo: "/email/dashboard" });
}
