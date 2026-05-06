// 広告KPI計算の集約。CTR/CPC/CVR/CPA を全箇所で同じロジックに統一する。

export const calcMetrics = {
  ctr: (clicks: number, impressions: number): number =>
    impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,

  cpc: (spend: number, clicks: number): number =>
    clicks > 0 ? Math.round(spend / clicks) : 0,

  cvr: (conversions: number, clicks: number): number =>
    clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0,

  cpa: (spend: number, conversions: number): number =>
    conversions > 0 ? Math.round(spend / conversions) : 0,
};

export interface MetricTotals {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
}

export function sumTotals<T extends MetricTotals>(rows: T[]): MetricTotals {
  return rows.reduce(
    (acc, d) => ({
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
      spend: acc.spend + d.spend,
      conversions: acc.conversions + d.conversions,
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0 },
  );
}
