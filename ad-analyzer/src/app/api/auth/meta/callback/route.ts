import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getLongLivedToken, getAdAccounts } from '@/lib/meta-auth';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=no_code', request.url)
    );
  }

  try {
    // 短期トークン取得
    const shortTokenData = await exchangeCodeForToken(code);

    // 長期トークンに交換
    const longTokenData = await getLongLivedToken(shortTokenData.access_token);

    // 広告アカウント一覧を取得
    const adAccounts = await getAdAccounts(longTokenData.access_token);

    // トークンをcookieに保存（本番ではDBに保存すべき）
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('meta_access_token', longTokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: longTokenData.expires_in,
      path: '/',
    });

    // 最初のアカウントIDをデフォルトで選択
    if (adAccounts.length > 0) {
      response.cookies.set('meta_ad_account_id', adAccounts[0].account_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: longTokenData.expires_in,
        path: '/',
      });
    }

    return response;
  } catch (err) {
    console.error('Meta OAuth error:', err);
    return NextResponse.redirect(
      new URL(`/login?error=auth_failed`, request.url)
    );
  }
}
