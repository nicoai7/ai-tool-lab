import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

export async function POST(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'

  // CSRF: 本番では Origin（フォールバックで Referer）が siteUrl と一致することを確認。
  // SameSite=Lax でも <form method="POST"> は防げないため、Origin/Referer 検証を追加。
  if (process.env.NODE_ENV === 'production') {
    const origin = req.headers.get('origin') ?? deriveOriginFromReferer(req.headers.get('referer'))
    if (!origin || origin !== siteUrl) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  const res = NextResponse.redirect(`${siteUrl}/`, { status: 303 })
  res.cookies.delete(SESSION_COOKIE)
  return res
}

function deriveOriginFromReferer(referer: string | null): string | null {
  if (!referer) return null
  try {
    const u = new URL(referer)
    return `${u.protocol}//${u.host}`
  } catch {
    return null
  }
}
