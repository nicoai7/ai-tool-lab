import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const { accountId, accountName } = await request.json();
  const cookieStore = await cookies();

  cookieStore.set('meta_ad_account_id', accountId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 60, // 60日
    path: '/',
  });

  cookieStore.set('meta_ad_account_name', encodeURIComponent(accountName), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 60,
    path: '/',
  });

  return NextResponse.json({ ok: true });
}
