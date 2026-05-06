// Meta Marketing API データ取得層

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0';

interface InsightParams {
  accessToken: string;
  accountId: string;
  startDate: string;
  endDate: string;
}

const COMMON_FIELDS = [
  'impressions',
  'clicks',
  'ctr',
  'cpc',
  'cpm',
  'spend',
  'reach',
  'frequency',
  'actions',
  'cost_per_action_type',
].join(',');

async function fetchInsights(
  params: InsightParams,
  extraParams: Record<string, string> = {}
): Promise<any[]> {
  const url = new URL(`${META_GRAPH_URL}/act_${params.accountId}/insights`);
  url.searchParams.set('access_token', params.accessToken);
  url.searchParams.set('fields', COMMON_FIELDS);
  url.searchParams.set('time_range', JSON.stringify({
    since: params.startDate,
    until: params.endDate,
  }));
  url.searchParams.set('limit', '500');

  for (const [key, value] of Object.entries(extraParams)) {
    url.searchParams.set(key, value);
  }

  const allData: any[] = [];
  let nextUrl: string | null = url.toString();

  while (nextUrl) {
    const response: Response = await fetch(nextUrl);
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Meta API error: ${JSON.stringify(errorBody)}`);
    }
    const json = await response.json();
    allData.push(...(json.data || []));
    nextUrl = json.paging?.next || null;
  }

  return allData;
}

// サマリー（全体）
export async function getAccountInsights(params: InsightParams) {
  return fetchInsights(params);
}

// 日別
export async function getDailyInsights(params: InsightParams) {
  return fetchInsights(params, { time_increment: '1' });
}

// 月別
export async function getMonthlyInsights(params: InsightParams) {
  return fetchInsights(params, { time_increment: 'monthly' });
}

// 時間帯別
export async function getHourlyInsights(params: InsightParams) {
  return fetchInsights(params, {
    breakdowns: 'hourly_stats_aggregated_by_advertiser_time_zone',
  });
}

// デバイス別
export async function getDeviceInsights(params: InsightParams) {
  return fetchInsights(params, { breakdowns: 'device_platform' });
}

// 性別
export async function getGenderInsights(params: InsightParams) {
  return fetchInsights(params, { breakdowns: 'gender' });
}

// 年齢
export async function getAgeInsights(params: InsightParams) {
  return fetchInsights(params, { breakdowns: 'age' });
}

// 年齢×性別
export async function getAgeGenderInsights(params: InsightParams) {
  return fetchInsights(params, { breakdowns: 'age,gender' });
}

// 地域
export async function getRegionInsights(params: InsightParams) {
  return fetchInsights(params, { breakdowns: 'region' });
}

// 配置面（プラットフォーム×ポジション）
export async function getPlacementInsights(params: InsightParams) {
  return fetchInsights(params, {
    breakdowns: 'publisher_platform,platform_position',
  });
}

// キャンペーン別
export async function getCampaignInsights(params: InsightParams) {
  const url = new URL(`${META_GRAPH_URL}/act_${params.accountId}/insights`);
  url.searchParams.set('access_token', params.accessToken);
  url.searchParams.set('fields', `campaign_id,campaign_name,${COMMON_FIELDS}`);
  url.searchParams.set('level', 'campaign');
  url.searchParams.set('time_range', JSON.stringify({
    since: params.startDate,
    until: params.endDate,
  }));
  url.searchParams.set('limit', '500');

  const res = await fetch(url.toString());
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Meta API error: ${JSON.stringify(error)}`);
  }
  const json = await res.json();
  return json.data || [];
}

// 広告セット別
export async function getAdSetInsights(params: InsightParams) {
  const url = new URL(`${META_GRAPH_URL}/act_${params.accountId}/insights`);
  url.searchParams.set('access_token', params.accessToken);
  url.searchParams.set('fields', `adset_id,adset_name,campaign_id,campaign_name,${COMMON_FIELDS}`);
  url.searchParams.set('level', 'adset');
  url.searchParams.set('time_range', JSON.stringify({
    since: params.startDate,
    until: params.endDate,
  }));
  url.searchParams.set('limit', '500');

  const res = await fetch(url.toString());
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Meta API error: ${JSON.stringify(error)}`);
  }
  const json = await res.json();
  return json.data || [];
}

// 広告別
export async function getAdInsights(params: InsightParams) {
  const url = new URL(`${META_GRAPH_URL}/act_${params.accountId}/insights`);
  url.searchParams.set('access_token', params.accessToken);
  url.searchParams.set('fields', `ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,${COMMON_FIELDS}`);
  url.searchParams.set('level', 'ad');
  url.searchParams.set('time_range', JSON.stringify({
    since: params.startDate,
    until: params.endDate,
  }));
  url.searchParams.set('limit', '500');

  const res = await fetch(url.toString());
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Meta API error: ${JSON.stringify(error)}`);
  }
  const json = await res.json();
  return json.data || [];
}

// 広告クリエイティブ情報取得
export async function getAdCreatives(accessToken: string, adIds: string[]) {
  const creatives: any[] = [];

  for (const adId of adIds) {
    const url = new URL(`${META_GRAPH_URL}/${adId}`);
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('fields', 'creative{id,name,thumbnail_url,image_url,video_id,body,title}');

    const res = await fetch(url.toString());
    if (res.ok) {
      const json = await res.json();
      if (json.creative) {
        creatives.push({ adId, ...json.creative });
      }
    }
  }

  return creatives;
}

// ヘルパー: APIレスポンスからコンバージョン数を抽出
export function extractConversions(actions: any[] | undefined): number {
  if (!actions) return 0;
  const cvAction = actions.find(
    (a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
                a.action_type === 'offsite_conversion.fb_pixel_lead' ||
                a.action_type === 'lead' ||
                a.action_type === 'purchase' ||
                a.action_type === 'complete_registration' ||
                a.action_type === 'omni_purchase'
  );
  return cvAction ? parseInt(cvAction.value, 10) : 0;
}

// ヘルパー: CPAを抽出
export function extractCPA(costPerActions: any[] | undefined): number {
  if (!costPerActions) return 0;
  const cpaAction = costPerActions.find(
    (a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
                a.action_type === 'offsite_conversion.fb_pixel_lead' ||
                a.action_type === 'lead' ||
                a.action_type === 'purchase' ||
                a.action_type === 'complete_registration' ||
                a.action_type === 'omni_purchase'
  );
  return cpaAction ? parseFloat(cpaAction.value) : 0;
}
