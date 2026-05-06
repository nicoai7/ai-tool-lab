import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as metaApi from '@/lib/meta-api';

type BreakdownType = 'summary' | 'daily' | 'monthly' | 'hourly' | 'device' | 'gender' | 'age' | 'region' | 'placement' | 'campaign' | 'adset' | 'ad';

const fetcherMap: Record<BreakdownType, (params: any) => Promise<any[]>> = {
  summary: metaApi.getAccountInsights,
  daily: metaApi.getDailyInsights,
  monthly: metaApi.getMonthlyInsights,
  hourly: metaApi.getHourlyInsights,
  device: metaApi.getDeviceInsights,
  gender: metaApi.getGenderInsights,
  age: metaApi.getAgeInsights,
  region: metaApi.getRegionInsights,
  placement: metaApi.getPlacementInsights,
  campaign: metaApi.getCampaignInsights,
  adset: metaApi.getAdSetInsights,
  ad: metaApi.getAdInsights,
};

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('meta_access_token')?.value;
  const accountId = cookieStore.get('meta_ad_account_id')?.value;

  if (!accessToken || !accountId) {
    return NextResponse.json(
      { error: 'Not authenticated. Please connect your Meta account.' },
      { status: 401 }
    );
  }

  const { searchParams } = request.nextUrl;
  const breakdown = (searchParams.get('breakdown') || 'summary') as BreakdownType;
  const startDate = searchParams.get('startDate') || '2026-03-01';
  const endDate = searchParams.get('endDate') || '2026-03-29';

  const fetcher = fetcherMap[breakdown];
  if (!fetcher) {
    return NextResponse.json({ error: 'Invalid breakdown type' }, { status: 400 });
  }

  try {
    const data = await fetcher({
      accessToken,
      accountId,
      startDate,
      endDate,
    });

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error(`Insights API error (${breakdown}):`, err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
