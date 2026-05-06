import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';

export async function POST() {
  const cookieStore = await cookies();
  const accountId = cookieStore.get('meta_ad_account_id')?.value;

  if (!accountId) {
    return NextResponse.json({ error: 'No account selected' }, { status: 400 });
  }

  revalidateTag(`meta-account-${accountId}`);
  return NextResponse.json({ ok: true, invalidated: `meta-account-${accountId}` });
}
