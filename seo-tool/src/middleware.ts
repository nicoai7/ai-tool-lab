import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { SESSION_COOKIE } from '@/lib/session'

const ALLOWED_HOSTS = ['ai-tool-lab.net', 'www.ai-tool-lab.net']

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

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const hostname = host.split(':')[0]
  if (process.env.NODE_ENV === 'production' && !ALLOWED_HOSTS.includes(hostname)) {
    return new NextResponse('Forbidden: access this tool via https://ai-tool-lab.net/seo', { status: 403 })
  }

  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const authed = await isAuthed(token)

  const isPublic =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/not-friend') ||
    pathname.startsWith('/api/auth/line') ||
    pathname.startsWith('/auth/callback/line') ||
    pathname.startsWith('/api/logout')

  if (!authed && !isPublic) {
    const hubUrl = process.env.AUTH_HUB_URL
    if (hubUrl) {
      const url = new URL(`${hubUrl}/login`)
      url.searchParams.set('redirect', `/seo${pathname}`)
      return NextResponse.redirect(url)
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (authed && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
