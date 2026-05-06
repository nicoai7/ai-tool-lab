import { NextRequest, NextResponse } from 'next/server'
import {
  exchangeCodeForToken,
  fetchProfile,
  isSafeInternalPath,
  PKCE_COOKIE,
  PKCE_COOKIE_DEV,
  verifyIdToken,
  verifyState,
} from '@/lib/line/auth'
import { checkFriendship } from '@/lib/line/friendship'
import { signSession, SESSION_COOKIE } from '@/lib/session'

const isProd = process.env.NODE_ENV === 'production'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')
  const site = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin

  const fail = (key: string, redirectPath?: string) => {
    const url = new URL(`${site}/login`)
    url.searchParams.set('error', key)
    if (redirectPath && isSafeInternalPath(redirectPath)) {
      url.searchParams.set('redirect', redirectPath)
    }
    const res = NextResponse.redirect(url)
    // 失敗時も PKCE cookie は不要なので削除
    res.cookies.delete(isProd ? PKCE_COOKIE : PKCE_COOKIE_DEV)
    return res
  }

  if (error) return fail(error)
  if (!code || !state) return fail('missing_params')

  const verified = await verifyState(state)
  if (!verified) return fail('state_mismatch')
  const { redirectPath, codeChallenge } = verified

  // PKCE cookie から verifier と nonce を取り出す
  const pkceCookieName = isProd ? PKCE_COOKIE : PKCE_COOKIE_DEV
  const pkceRaw = req.cookies.get(pkceCookieName)?.value
  if (!pkceRaw) return fail('pkce_missing', redirectPath)
  let pkce: { v: string; n: string }
  try {
    pkce = JSON.parse(pkceRaw)
    if (typeof pkce.v !== 'string' || typeof pkce.n !== 'string') throw new Error()
  } catch {
    return fail('pkce_invalid', redirectPath)
  }

  // state JWT 内の challenge と verifier の整合を事前チェック（LINE token endpoint に投げる前に）
  const challengeFromVerifier = await sha256Base64Url(pkce.v)
  if (challengeFromVerifier !== codeChallenge) {
    return fail('pkce_mismatch', redirectPath)
  }

  try {
    const token = await exchangeCodeForToken({ code, codeVerifier: pkce.v })

    // id_token を検証（署名・iss・aud・nonce・exp）
    const claims = await verifyIdToken(token.id_token)
    if (!claims) return fail('id_token_invalid', redirectPath)
    if (claims.nonce !== pkce.n) return fail('nonce_mismatch', redirectPath)

    const profile = await fetchProfile(token.access_token)
    if (profile.userId !== claims.sub) return fail('subject_mismatch', redirectPath)

    const status = await checkFriendship(token.access_token, profile.userId)
    if (status === 'unauthorized') return fail('session_expired', redirectPath)
    if (status === 'error') return fail('friendship_check_failed', redirectPath)
    if (status === 'not_friend') {
      const url = new URL(`${site}/not-friend`)
      if (profile.displayName) url.searchParams.set('name', profile.displayName)
      const res = NextResponse.redirect(url)
      res.cookies.delete(pkceCookieName)
      return res
    }

    const sessionToken = await signSession({
      sub: profile.userId,
      name: profile.displayName,
      picture: profile.pictureUrl,
      accessToken: token.access_token,
    })

    const target = isSafeInternalPath(redirectPath) ? redirectPath : '/dashboard'
    const res = NextResponse.redirect(`${site}${target}`)
    res.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    res.cookies.delete(pkceCookieName)
    return res
  } catch (e) {
    // 詳細はログのみ（Vercel Runtime Logs から閲覧可）
    if (process.env.NODE_ENV !== 'production') {
      console.error('LINE callback error:', e)
    }
    return fail('callback_failed', redirectPath)
  }
}

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
