import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { unstable_cache } from 'next/cache';
import * as metaApi from '@/lib/meta-api';

type BreakdownType = 'summary' | 'daily' | 'monthly' | 'hourly' | 'device' | 'gender' | 'age' | 'region' | 'placement' | 'campaign' | 'adset' | 'ad';

interface FetchParams {
  accessToken: string;
  accountId: string;
  startDate: string;
  endDate: string;
}

const fetcherMap: Record<BreakdownType, (params: FetchParams) => Promise<unknown[]>> = {
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

// 10分でリフレッシュ、1時間で完全失効
const REVALIDATE_SECONDS = 600;

function fetchCached(
  breakdown: BreakdownType,
  accountId: string,
  startDate: string,
  endDate: string,
  accessToken: string,
): Promise<unknown[]> {
  // キャッシュキーには accessToken を含めず、タグに accountId/breakdown を含める。
  // accessToken は内部実装の引数として渡すだけでキャッシュキーに影響させない。
  const cached = unstable_cache(
    async () => {
      const fetcher = fetcherMap[breakdown];
      return fetcher({ accessToken, accountId, startDate, endDate });
    },
    ['meta-insights', breakdown, accountId, startDate, endDate],
    {
      revalidate: REVALIDATE_SECONDS,
      tags: [
        `meta-account-${accountId}`,
        `meta-account-${accountId}-${breakdown}`,
      ],
    },
  );
  return cached();
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('meta_access_token')?.value;
  const accountId = cookieStore.get('meta_ad_account_id')?.value;

  if (!accessToken || !accountId) {
    return NextResponse.json(
      { error: 'Not authenticated. Please connect your Meta account.' },
      { status: 401 },
    );
  }

  const { searchParams } = request.nextUrl;
  const breakdown = (searchParams.get('breakdown') || 'summary') as BreakdownType;
  const startDate = searchParams.get('startDate') || '2026-03-01';
  const endDate = searchParams.get('endDate') || '2026-03-29';

  if (!fetcherMap[breakdown]) {
    return NextResponse.json({ error: 'Invalid breakdown type' }, { status: 400 });
  }

  try {
    const data = await fetchCached(breakdown, accountId, startDate, endDate, accessToken);
    return NextResponse.json({ data });
  } catch (err) {
    console.error(`Insights API error (${breakdown}):`, err);
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to fetch insights' },
      { status: 500 },
    );
  }
}
