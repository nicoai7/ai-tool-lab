import { NextRequest, NextResponse } from 'next/server'
import {
  buildAuthorizeUrl,
  generatePkce,
  generateNonce,
  signState,
  isSafeInternalPath,
  PKCE_COOKIE,
  PKCE_COOKIE_DEV,
} from '@/lib/line/auth'

const isProd = process.env.NODE_ENV === 'production'

export async function GET(req: NextRequest) {
  const rawRedirect = req.nextUrl.searchParams.get('redirect') || undefined
  const redirectPath = isSafeInternalPath(rawRedirect) ? rawRedirect : undefined

  const { verifier, challenge } = await generatePkce()
  const nonce = generateNonce()
  const state = await signState({ redirectPath, codeChallenge: challenge })
  const url = buildAuthorizeUrl({ state, codeChallenge: challenge, nonce })

  const res = NextResponse.redirect(url)
  // PKCE verifier と nonce を httpOnly cookie に保存。callback で消費して削除する。
  // __Host- プレフィックスは secure 必須なので本番のみ。
  const cookieName = isProd ? PKCE_COOKIE : PKCE_COOKIE_DEV
  res.cookies.set(cookieName, JSON.stringify({ v: verifier, n: nonce }), {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5, // state TTL と一致
  })
  return res
}
