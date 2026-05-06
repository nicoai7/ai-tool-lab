import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('meta_access_token')?.value;
  const accountId = cookieStore.get('meta_ad_account_id')?.value;
  const accountName = cookieStore.get('meta_ad_account_name')?.value;

  return NextResponse.json({
    authenticated: !!accessToken,
    accountId: accountId || null,
    accountName: accountName ? decodeURIComponent(accountName) : null,
  });
}
