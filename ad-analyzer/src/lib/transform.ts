// Meta APIレスポンス → アプリ内データ型への変換

import { BreakdownData, DailyData } from '@/types/meta';
import { extractConversions, extractCPA } from './meta-api';

const DAYS_OF_WEEK = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

function calcCvr(clicks: number, conversions: number): number {
  return clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0;
}

// 汎用ブレイクダウンデータ変換
export function toBreakdownData(raw: any[], labelFn: (item: any) => string): BreakdownData[] {
  return raw.map(item => {
    const impressions = parseInt(item.impressions || '0', 10);
    const clicks = parseInt(item.clicks || '0', 10);
    const ctr = parseFloat(item.ctr || '0');
    const cpc = parseFloat(item.cpc || '0');
    const spend = parseFloat(item.spend || '0');
    const conversions = extractConversions(item.actions);
    const cpa = extractCPA(item.cost_per_action_type);
    const cvr = calcCvr(clicks, conversions);

    return {
      label: labelFn(item),
      impressions,
      clicks,
      ctr: Math.round(ctr * 100) / 100,
      cpc: Math.round(cpc),
      spend: Math.round(spend),
      conversions,
      cvr,
      cpa: Math.round(cpa),
    };
  });
}

// 日別データ変換
export function toDailyData(raw: any[]): DailyData[] {
  return raw.map(item => {
    const impressions = parseInt(item.impressions || '0', 10);
    const clicks = parseInt(item.clicks || '0', 10);
    const ctr = parseFloat(item.ctr || '0');
    const cpc = parseFloat(item.cpc || '0');
    const spend = parseFloat(item.spend || '0');
    const conversions = extractConversions(item.actions);
    const cpa = extractCPA(item.cost_per_action_type);
    const cvr = calcCvr(clicks, conversions);
    const date = item.date_start;
    const dayOfWeek = DAYS_OF_WEEK[new Date(date).getDay()];

    return {
      date,
      dayOfWeek,
      impressions,
      clicks,
      ctr: Math.round(ctr * 100) / 100,
      cpc: Math.round(cpc),
      spend: Math.round(spend),
      conversions,
      cvr,
      cpa: Math.round(cpa),
    };
  });
}

// 月別ラベル
export function monthLabel(item: any): string {
  const d = new Date(item.date_start);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

// 時間帯ラベル
export function hourLabel(item: any): string {
  const hour = item.hourly_stats_aggregated_by_advertiser_time_zone;
  return `${hour}時`;
}

// デバイスラベル
export function deviceLabel(item: any): string {
  const map: Record<string, string> = {
    mobile_app: 'スマートフォン',
    mobile_web: 'スマートフォン',
    desktop: 'PC',
    other: 'その他',
  };
  return map[item.device_platform] || item.device_platform || 'その他';
}

// 性別ラベル
export function genderLabel(item: any): string {
  const map: Record<string, string> = { male: '男性', female: '女性', unknown: '不明' };
  return map[item.gender] || item.gender || '不明';
}

// 年齢ラベル
export function ageLabel(item: any): string {
  return item.age || '不明';
}

// 地域ラベル
export function regionLabel(item: any): string {
  return item.region || '不明';
}

// キャンペーンラベル
export function campaignLabel(item: any): string {
  return item.campaign_name || item.campaign_id || '不明';
}

// 広告セットラベル
export function adsetLabel(item: any): string {
  return item.adset_name || item.adset_id || '不明';
}

// 広告ラベル
export function adLabel(item: any): string {
  return item.ad_name || item.ad_id || '不明';
}

// 曜日別に集約
export function aggregateByWeekday(dailyData: DailyData[]): BreakdownData[] {
  const weekdayMap = new Map<string, { impressions: number; clicks: number; spend: number; conversions: number }>();
  const order = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

  for (const day of order) {
    weekdayMap.set(day, { impressions: 0, clicks: 0, spend: 0, conversions: 0 });
  }

  for (const d of dailyData) {
    const existing = weekdayMap.get(d.dayOfWeek)!;
    existing.impressions += d.impressions;
    existing.clicks += d.clicks;
    existing.spend += d.spend;
    existing.conversions += d.conversions;
  }

  return order.map(dayName => {
    const data = weekdayMap.get(dayName)!;
    const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
    const cpc = data.clicks > 0 ? data.spend / data.clicks : 0;
    const cvr = calcCvr(data.clicks, data.conversions);
    const cpa = data.conversions > 0 ? data.spend / data.conversions : 0;
    return {
      label: dayName,
      impressions: data.impressions,
      clicks: data.clicks,
      ctr: Math.round(ctr * 100) / 100,
      cpc: Math.round(cpc),
      spend: Math.round(data.spend),
      conversions: data.conversions,
      cvr,
      cpa: Math.round(cpa),
    };
  });
}

// アカウントサマリーを生成
export function toAccountSummary(raw: any[], accountName: string) {
  if (raw.length === 0) return null;
  const item = raw[0];
  const impressions = parseInt(item.impressions || '0', 10);
  const clicks = parseInt(item.clicks || '0', 10);
  const spend = parseFloat(item.spend || '0');
  const conversions = extractConversions(item.actions);
  const cpa = extractCPA(item.cost_per_action_type);

  return {
    accountName,
    impressions,
    clicks,
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
    cpc: clicks > 0 ? Math.round(spend / clicks) : 0,
    spend: Math.round(spend),
    conversions,
    cvr: calcCvr(clicks, conversions),
    cpa: Math.round(cpa),
  };
}
