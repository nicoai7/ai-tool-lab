import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      {/* ヘッダー */}
      <header className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 48 48" className="h-8 w-8">
              <path fill="#EA4335" d="M6 12l18 12 18-12v-2c0-2.2-1.8-4-4-4H10c-2.2 0-4 1.8-4 4v2z"/>
              <path fill="#4285F4" d="M6 12v24c0 2.2 1.8 4 4 4h4V18L6 12z"/>
              <path fill="#34A853" d="M38 40h4c2.2 0 4-1.8 4-4V12l-8 6v22z"/>
              <path fill="#FBBC05" d="M14 40h20V18l-10 8-10-8v22z"/>
            </svg>
            <h1 className="text-lg font-medium text-[#202124]">メール要約</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              {session.user?.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <DashboardClient />
      </main>
    </div>
  );
}
