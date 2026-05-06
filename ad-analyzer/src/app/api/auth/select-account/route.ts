import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdAccounts } from '@/lib/meta-auth';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('meta_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { accountId?: unknown; accountName?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { accountId, accountName } = body;
  if (typeof accountId !== 'string' || typeof accountName !== 'string') {
    return NextResponse.json({ error: 'accountId and accountName are required' }, { status: 400 });
  }

  // ユーザーが実際に所有するアカウントかを Meta API で検証
  try {
    const accounts = await getAdAccounts(accessToken);
    const owned = accounts.find(a => a.account_id === accountId);
    if (!owned) {
      return NextResponse.json({ error: 'Account not owned by user' }, { status: 403 });
    }
  } catch (err) {
    console.error('Account validation failed:', err);
    return NextResponse.json({ error: 'Failed to verify account ownership' }, { status: 500 });
  }

  cookieStore.set('meta_ad_account_id', accountId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 60,
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
