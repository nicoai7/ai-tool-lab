import { NextResponse, type NextRequest } from 'next/server'
import { jwtDecrypt } from 'jose'
import { SESSION_COOKIE } from '@/lib/session'

const PROTECTED_PATHS = ['/dashboard', '/account']
const TOOL_PATH_PREFIXES = ['/ad-analyzer', '/seo', '/email']
const SESSION_AUDIENCE = 'session'
const ISSUER = 'ai-tool-lab/auth'

// 本番で許可するホスト名（vercel preview等の直叩きを 403 で塞ぐ）
const ALLOWED_HOSTS = new Set(['ai-tool-lab.net', 'www.ai-tool-lab.net'])

// proxy.ts は CDN にデプロイされる前提で、global state や module-scoped cache に依存してはいけない。
// 鍵導出は毎呼び出しで実行する（HS256 と違い JWE A256GCM は SHA-256 による正規化が必要）。
async function deriveKey(secret: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return new Uint8Array(digest)
}

async function isAuthed(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const secret = process.env.SESSION_SECRET
  if (!secret) return false
  try {
    const key = await deriveKey(secret)
    await jwtDecrypt(token, key, {
      issuer: ISSUER,
      audience: SESSION_AUDIENCE,
    })
    return true
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 本番では許可ホスト以外を 403。preview URL や *.vercel.app の直叩きを塞ぐ。
  if (process.env.NODE_ENV === 'production') {
    const host = request.headers.get('host') ?? ''
    if (!ALLOWED_HOSTS.has(host)) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const authed = await isAuthed(token)

  const isToolPath = TOOL_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p)) || isToolPath

  if (isProtected && !authed) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname + (request.nextUrl.search || ''))
    return NextResponse.redirect(url)
  }

  if (pathname === '/login' && authed) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// 保護対象パスのみ allowlist 化。静的アセット・ランディング・/not-friend では proxy が走らない。
// /api/logout は CSRF 対策が必要なため /api/logout のみ含める。
export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/account/:path*',
    '/ad-analyzer/:path*',
    '/seo/:path*',
    '/email/:path*',
    '/api/logout',
  ],
}
