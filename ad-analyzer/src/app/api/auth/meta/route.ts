import { NextResponse } from 'next/server';
import { getMetaLoginUrl, generateOAuthState } from '@/lib/meta-auth';

const STATE_COOKIE = 'meta_oauth_state';

export async function GET() {
  const state = generateOAuthState();
  const loginUrl = getMetaLoginUrl(state);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10分
    path: '/',
  });
  return response;
}
