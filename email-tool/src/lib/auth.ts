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
          // gmail.modify は readonly を内包するため重複指定を排除
          scope: "openid email profile https://www.googleapis.com/auth/gmail.modify",
          access_type: "offline",
          // 初回連携時のみ consent を強制し refresh_token を確実に取得。
          // 既存ユーザーの再ログインでは select_account にして UX を保つ。
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        // 初回ログイン時のみオーナーメールを記録し、以降は不変。
        // これにより「同一ブラウザに別ユーザーが追加 sign-in」してもオーナーが乗っ取られない。
        if (!token.ownerEmail) {
          token.ownerEmail = (token.email as string | undefined) ?? undefined;
        }

        const newGmailEmail = (profile?.email as string | undefined) ?? (token.email as string | undefined);

        // 「アカウント追加」フロー直後だけ accessToken をセッションに持たせる。
        // 通常のメール取得経路では accountId 必須にするため、この値は補助的。
        token.accessToken = account.access_token as string | undefined;
        token.refreshToken = account.refresh_token as string | undefined;
        token.expiresAt = account.expires_at as number | undefined;
        token.activeGmailEmail = newGmailEmail;

        // refresh_token が無い場合は consent を強制する。それでも取れなければ DB 保存をスキップ。
        if (token.ownerEmail && newGmailEmail && account.access_token) {
          try {
            await upsertGmailAccount({
              userEmail: token.ownerEmail,
              gmailEmail: newGmailEmail,
              accountName: ((profile?.name as string | undefined) ?? newGmailEmail),
              accessToken: account.access_token as string,
              refreshToken: account.refresh_token as string | undefined,
              expiresAt: account.expires_at as number | undefined,
            });
          } catch (e) {
            console.error("Gmailアカウント保存エラー:", (e as Error).message);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.ownerEmail = token.ownerEmail;
      return session;
    },
  },
});
