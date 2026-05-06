import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdAccounts } from '@/lib/meta-auth';

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('meta_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const accounts = await getAdAccounts(accessToken);
    return NextResponse.json({ accounts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
