import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE = 'ai_tool_lab_session'
const ALLOWED_HOSTS = ['ai-tool-lab.net', 'www.ai-tool-lab.net']

async function isLineAuthed(token: string | undefined): Promise<boolean> {
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
    return new NextResponse('Forbidden: access this tool via https://ai-tool-lab.net/email', { status: 403 })
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!(await isLineAuthed(token))) {
    const hubUrl = process.env.AUTH_HUB_URL || 'https://ai-tool-lab.net'
    const url = new URL(`${hubUrl}/login`)
    url.searchParams.set('redirect', `/email${request.nextUrl.pathname.replace(/^\/email/, '')}${request.nextUrl.search}`)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
