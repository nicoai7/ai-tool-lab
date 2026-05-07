import { NextRequest } from "next/server";

const ALLOWED_HOSTS = new Set(["ai-tool-lab.net", "www.ai-tool-lab.net"]);

function originFromReferer(referer: string | null): string | null {
  if (!referer) return null;
  try {
    const u = new URL(referer);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

// 状態変更 API 用の CSRF ガード。production では Origin（or Referer）が許可ホスト配下であることを必須化。
export function assertSameOrigin(req: NextRequest): { ok: true } | { ok: false; reason: string } {
  if (process.env.NODE_ENV !== "production") return { ok: true };

  const origin = req.headers.get("origin") ?? originFromReferer(req.headers.get("referer"));
  if (!origin) return { ok: false, reason: "missing_origin" };
  try {
    const host = new URL(origin).host;
    if (!ALLOWED_HOSTS.has(host)) return { ok: false, reason: "host_mismatch" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "invalid_origin" };
  }
}
