import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getLongLivedToken, getAdAccounts } from '@/lib/meta-auth';

const STATE_COOKIE = 'meta_oauth_state';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  if (error) {
    return redirectWithCleanup(request, `/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return redirectWithCleanup(request, '/login?error=no_code');
  }

  // CSRF対策: state検証
  if (!state || !expectedState || state !== expectedState) {
    return redirectWithCleanup(request, '/login?error=invalid_state');
  }

  try {
    const shortTokenData = await exchangeCodeForToken(code);
    const longTokenData = await getLongLivedToken(shortTokenData.access_token);
    const adAccounts = await getAdAccounts(longTokenData.access_token);

    if (adAccounts.length === 0) {
      return redirectWithCleanup(request, '/login?error=no_ad_accounts');
    }

    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete(STATE_COOKIE);

    response.cookies.set('meta_access_token', longTokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: longTokenData.expires_in,
      path: '/',
    });

    response.cookies.set('meta_ad_account_id', adAccounts[0].account_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: longTokenData.expires_in,
      path: '/',
    });

    response.cookies.set('meta_ad_account_name', encodeURIComponent(adAccounts[0].name), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: longTokenData.expires_in,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Meta OAuth error:', err);
    return redirectWithCleanup(request, '/login?error=auth_failed');
  }
}

function redirectWithCleanup(request: NextRequest, target: string): NextResponse {
  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.delete(STATE_COOKIE);
  return response;
}
