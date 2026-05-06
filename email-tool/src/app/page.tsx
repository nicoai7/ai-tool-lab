import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8fc]">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200/60">
        <div className="mb-8 text-center">
          {/* Gmailカラーのエンベロープアイコン */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center">
            <svg viewBox="0 0 48 48" className="h-16 w-16">
              <path fill="#EA4335" d="M6 12l18 12 18-12v-2c0-2.2-1.8-4-4-4H10c-2.2 0-4 1.8-4 4v2z"/>
              <path fill="#4285F4" d="M6 12v24c0 2.2 1.8 4 4 4h4V18L6 12z"/>
              <path fill="#34A853" d="M38 40h4c2.2 0 4-1.8 4-4V12l-8 6v22z"/>
              <path fill="#FBBC05" d="M14 40h20V18l-10 8-10-8v22z"/>
              <path fill="#C5221F" d="M6 10v2l18 12 18-12v-2c0-2.2-1.8-4-4-4H10c-2.2 0-4 1.8-4 4z" opacity="0.1"/>
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-[#202124]">
            メール要約・優先順位ツール
          </h1>
          <p className="text-sm text-[#5f6368]">
            AIがメールを自動で要約・優先度分類します
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#1a73e8] px-6 py-3.5 text-base font-medium text-white shadow-sm transition hover:bg-[#1765cc] hover:shadow-md"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Googleアカウントでログイン
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#5f6368]">
          Gmailの閲覧権限を使用してメールを分析します
        </p>
      </div>
    </div>
  );
}
