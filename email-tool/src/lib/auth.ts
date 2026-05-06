import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertGmailAccount } from "./supabase";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        // 初回ログイン時にオーナーメールを記録
        // 2回目以降（アカウント追加時）はオーナーを維持
        if (!token.ownerEmail) {
          token.ownerEmail = token.email;
        }

        const newGmailEmail = profile?.email || token.email;

        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        // 現在アクティブなGmailアドレスを記録
        token.activeGmailEmail = newGmailEmail;

        // DBにGmailアカウントを保存（常にオーナーに紐付け）
        try {
          await upsertGmailAccount({
            userEmail: token.ownerEmail as string,
            gmailEmail: newGmailEmail as string,
            accountName: (profile?.name || newGmailEmail) as string,
            accessToken: account.access_token as string,
            refreshToken: account.refresh_token as string | undefined,
            expiresAt: account.expires_at as number | undefined,
          });
        } catch (e) {
          console.error("Gmailアカウント保存エラー:", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      // オーナーメールをセッションに公開（アカウント一覧取得用）
      (session as any).ownerEmail = token.ownerEmail || token.email;
      return session;
    },
  },
});
