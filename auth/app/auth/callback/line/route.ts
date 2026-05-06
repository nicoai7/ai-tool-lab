import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, fetchProfile, verifyState } from '@/lib/line/auth'
import { checkFriendship } from '@/lib/line/friendship'
import { signSession, SESSION_COOKIE } from '@/lib/session'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const error = req.nextUrl.searchParams.get('error')
  const site = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin

  if (error) {
    return NextResponse.redirect(`${site}/login?error=${encodeURIComponent(error)}`)
  }
  if (!code || !state) {
    return NextResponse.redirect(`${site}/login?error=missing_params`)
  }

  const verified = await verifyState(state)
  if (!verified) {
    return NextResponse.redirect(`${site}/login?error=state_mismatch`)
  }
  const { redirectPath } = verified

  try {
    const token = await exchangeCodeForToken(code)
    const profile = await fetchProfile(token.access_token)
    const isFriend = await checkFriendship(token.access_token)

    if (!isFriend) {
      const url = new URL(`${site}/not-friend`)
      if (profile.displayName) url.searchParams.set('name', profile.displayName)
      return NextResponse.redirect(url)
    }

    const sessionToken = await signSession({
      sub: profile.userId,
      name: profile.displayName,
      picture: profile.pictureUrl,
      accessToken: token.access_token,
    })

    const target = redirectPath && redirectPath.startsWith('/') ? redirectPath : '/dashboard'
    const res = NextResponse.redirect(`${site}${target}`)
    res.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (e) {
    console.error('LINE callback error:', e)
    return NextResponse.redirect(`${site}/login?error=callback_failed`)
  }
}
