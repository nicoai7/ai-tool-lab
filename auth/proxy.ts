import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { SESSION_COOKIE } from '@/lib/session'

const PROTECTED_PATHS = ['/dashboard', '/account']
const TOOL_PATH_PREFIXES = ['/ad-analyzer', '/seo', '/email']

async function isAuthed(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const secret = process.env.SESSION_SECRET
  if (!secret) return false
  try {
    await jwtVerify(token, new TextEncoder().encode(secret))
    return true
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
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

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|auth/callback).*)'],
}
