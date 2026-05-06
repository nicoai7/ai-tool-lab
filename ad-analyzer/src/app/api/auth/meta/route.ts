import { NextResponse } from 'next/server';
import { getMetaLoginUrl } from '@/lib/meta-auth';

export async function GET() {
  const loginUrl = getMetaLoginUrl();
  return NextResponse.redirect(loginUrl);
}
