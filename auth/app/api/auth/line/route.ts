import { NextRequest, NextResponse } from 'next/server'
import { buildAuthorizeUrl, signState } from '@/lib/line/auth'

export async function GET(req: NextRequest) {
  const redirectPath = req.nextUrl.searchParams.get('redirect') || undefined
  const state = await signState(redirectPath)
  const url = buildAuthorizeUrl(state)
  return NextResponse.redirect(url)
}
