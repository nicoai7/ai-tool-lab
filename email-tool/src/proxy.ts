import { NextResponse, type NextRequest } from "next/server";
import { jwtDecrypt } from "jose";

// auth プロジェクトと同期（__Host- prefix は production のみ）
const SESSION_COOKIE_PROD = "__Host-ai_tool_lab_session";
const SESSION_COOKIE_DEV = "ai_tool_lab_session";
const ALLOWED_HOSTS = new Set(["ai-tool-lab.net", "www.ai-tool-lab.net"]);
const ISSUER = "ai-tool-lab/auth";
const SESSION_AUDIENCE = "session";

async function deriveKey(secret: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return new Uint8Array(digest);
}

async function isLineAuthed(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  try {
    const key = await deriveKey(secret);
    await jwtDecrypt(token, key, {
      issuer: ISSUER,
      audience: SESSION_AUDIENCE,
    });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];
  if (process.env.NODE_ENV === "production" && !ALLOWED_HOSTS.has(hostname)) {
    return new NextResponse(
      "Forbidden: access this tool via https://ai-tool-lab.net/email",
      { status: 403 },
    );
  }

  // NextAuth callback (/api/auth/*) は LINE セッションが無い状態から始まるため認証ガードをかけない。
  // ただし上記 Host チェックは通すことで、preview URL 直叩きの OAuth 完了を阻止する。
  if (request.nextUrl.pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const cookieName =
    process.env.NODE_ENV === "production" ? SESSION_COOKIE_PROD : SESSION_COOKIE_DEV;
  const token = request.cookies.get(cookieName)?.value;
  if (!(await isLineAuthed(token))) {
    const hubUrl = process.env.AUTH_HUB_URL ?? "https://ai-tool-lab.net";
    const url = new URL(`${hubUrl}/login`);
    url.searchParams.set(
      "redirect",
      `/email${request.nextUrl.pathname.replace(/^\/email/, "")}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// 静的アセットのみ除外。NextAuth callback も Host チェック対象とするため matcher には含める。
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
