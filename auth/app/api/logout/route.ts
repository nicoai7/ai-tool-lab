import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

export async function POST() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'
  const res = NextResponse.redirect(`${siteUrl}/`, { status: 303 })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
