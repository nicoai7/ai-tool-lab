import { NextRequest, NextResponse } from 'next/server'
import { buildAuthorizeUrl, generateState } from '@/lib/line/auth'

export async function GET(req: NextRequest) {
  const redirectPath = req.nextUrl.searchParams.get('redirect') || undefined
  const nonce = generateState()
  const url = buildAuthorizeUrl(nonce, redirectPath)

  const res = NextResponse.redirect(url)
  res.cookies.set('line_oauth_state', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  })
  return res
}
