import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// 既ログインなら /dashboard にリダイレクト。Suspense 内で実行することで
// 静的シェルを先に流し、cookies() アクセスがブロッキングしないようにする。
export async function LandingRedirect() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }
  return null;
}
