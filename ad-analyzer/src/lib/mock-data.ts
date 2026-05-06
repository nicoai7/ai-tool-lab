// デモ用モックデータ（Meta API接続前の開発・デモ表示用）

import { KPIData, DailyData, BreakdownData, AdCreativeData, HourlyHeatmapData, CampaignData, AdGroupData } from '@/types/meta';

const DAYS_OF_WEEK = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

function cvr(clicks: number, conversions: number): number {
  return clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0;
}

export const mockKPIs: KPIData[] = [
  { label: 'クリック数', value: 3734, previousValue: 2397, changePercent: 55.8, format: 'number' },
  { label: 'クリック率', value: 0.7, previousValue: 2.75, changePercent: -73.2, format: 'percent' },
  { label: '表示回数', value: 507467, previousValue: 87266, changePercent: 481.5, format: 'number' },
];

export const mockConversionKPIs: KPIData[] = [
  { label: '獲得件数', value: 1256, previousValue: 34, changePercent: 3594.1, format: 'number' },
  { label: '獲得率', value: 33.6, previousValue: 1.42, changePercent: 2271.4, format: 'percent' },
  { label: '獲得単価', value: 128.3, previousValue: 3759, changePercent: -96.6, format: 'currency_decimal' },
];

export const mockCostKPIs: KPIData[] = [
  { label: 'ご利用金額', value: 161120, previousValue: 127816, changePercent: 26.1, format: 'currency' },
  { label: 'クリック単価', value: 43.1, previousValue: 53, changePercent: -19.1, format: 'currency_decimal' },
  { label: 'CPM', value: 317.5, previousValue: 1464.7, changePercent: -78.3, format: 'currency_decimal' },
];

export const mockDailyData: DailyData[] = [
  { date: '2026-03-01', dayOfWeek: '日曜日', impressions: 3180, clicks: 69, ctr: 2.17, cpc: 77, spend: 5295, conversions: 1, cvr: 1.45, cpa: 5295 },
  { date: '2026-03-02', dayOfWeek: '月曜日', impressions: 2897, clicks: 108, ctr: 3.73, cpc: 48, spend: 5185, conversions: 0, cvr: 0, cpa: 0 },
  { date: '2026-03-03', dayOfWeek: '火曜日', impressions: 3360, clicks: 89, ctr: 2.65, cpc: 63, spend: 5632, conversions: 0, cvr: 0, cpa: 0 },
  { date: '2026-03-04', dayOfWeek: '水曜日', impressions: 3319, clicks: 55, ctr: 1.66, cpc: 78, spend: 4301, conversions: 0, cvr: 0, cpa: 0 },
  { date: '2026-03-05', dayOfWeek: '木曜日', impressions: 3027, clicks: 53, ctr: 1.75, cpc: 89, spend: 4741, conversions: 1, cvr: 1.89, cpa: 4741 },
  { date: '2026-03-06', dayOfWeek: '金曜日', impressions: 75627, clicks: 332, ctr: 0.44, cpc: 18, spend: 5903, conversions: 241, cvr: 72.59, cpa: 24 },
  { date: '2026-03-07', dayOfWeek: '土曜日', impressions: 243428, clicks: 789, ctr: 0.32, cpc: 10, spend: 7532, conversions: 713, cvr: 90.37, cpa: 11 },
  { date: '2026-03-08', dayOfWeek: '日曜日', impressions: 4200, clicks: 95, ctr: 2.26, cpc: 58, spend: 5510, conversions: 0, cvr: 0, cpa: 0 },
  { date: '2026-03-09', dayOfWeek: '月曜日', impressions: 3500, clicks: 82, ctr: 2.34, cpc: 55, spend: 4510, conversions: 2, cvr: 2.44, cpa: 2255 },
  { date: '2026-03-10', dayOfWeek: '火曜日', impressions: 3614, clicks: 89, ctr: 2.46, cpc: 84, spend: 7443, conversions: 17, cvr: 19.1, cpa: 438 },
  { date: '2026-03-11', dayOfWeek: '水曜日', impressions: 4423, clicks: 176, ctr: 3.98, cpc: 56, spend: 9933, conversions: 53, cvr: 30.11, cpa: 187 },
  { date: '2026-03-12', dayOfWeek: '木曜日', impressions: 42, clicks: 3, ctr: 7.14, cpc: 43, spend: 130, conversions: 0, cvr: 0, cpa: 0 },
  { date: '2026-03-13', dayOfWeek: '金曜日', impressions: 1800, clicks: 95, ctr: 5.28, cpc: 52, spend: 4940, conversions: 28, cvr: 29.47, cpa: 176 },
  { date: '2026-03-14', dayOfWeek: '土曜日', impressions: 2100, clicks: 110, ctr: 5.24, cpc: 48, spend: 5280, conversions: 32, cvr: 29.09, cpa: 165 },
  { date: '2026-03-15', dayOfWeek: '日曜日', impressions: 2400, clicks: 120, ctr: 5.0, cpc: 55, spend: 6600, conversions: 30, cvr: 25.0, cpa: 220 },
  { date: '2026-03-16', dayOfWeek: '月曜日', impressions: 1900, clicks: 85, ctr: 4.47, cpc: 62, spend: 5270, conversions: 22, cvr: 25.88, cpa: 240 },
  { date: '2026-03-17', dayOfWeek: '火曜日', impressions: 2050, clicks: 78, ctr: 3.80, cpc: 70, spend: 5460, conversions: 18, cvr: 23.08, cpa: 303 },
  { date: '2026-03-18', dayOfWeek: '水曜日', impressions: 1750, clicks: 65, ctr: 3.71, cpc: 75, spend: 4875, conversions: 15, cvr: 23.08, cpa: 325 },
  { date: '2026-03-19', dayOfWeek: '木曜日', impressions: 1600, clicks: 55, ctr: 3.44, cpc: 80, spend: 4400, conversions: 12, cvr: 21.82, cpa: 367 },
  { date: '2026-03-20', dayOfWeek: '金曜日', impressions: 1500, clicks: 48, ctr: 3.20, cpc: 85, spend: 4080, conversions: 10, cvr: 20.83, cpa: 408 },
  { date: '2026-03-21', dayOfWeek: '土曜日', impressions: 2220, clicks: 35, ctr: 1.58, cpc: 141, spend: 4943, conversions: 6, cvr: 17.14, cpa: 824 },
  { date: '2026-03-22', dayOfWeek: '日曜日', impressions: 1470, clicks: 36, ctr: 2.45, cpc: 111, spend: 3986, conversions: 13, cvr: 36.11, cpa: 307 },
  { date: '2026-03-23', dayOfWeek: '月曜日', impressions: 2924, clicks: 44, ctr: 1.50, cpc: 132, spend: 5792, conversions: 9, cvr: 20.45, cpa: 644 },
  { date: '2026-03-24', dayOfWeek: '火曜日', impressions: 1864, clicks: 30, ctr: 1.61, cpc: 113, spend: 3395, conversions: 8, cvr: 26.67, cpa: 424 },
  { date: '2026-03-25', dayOfWeek: '水曜日', impressions: 808, clicks: 11, ctr: 1.36, cpc: 180, spend: 1981, conversions: 1, cvr: 9.09, cpa: 1981 },
  { date: '2026-03-26', dayOfWeek: '木曜日', impressions: 2154, clicks: 44, ctr: 2.04, cpc: 97, spend: 4268, conversions: 9, cvr: 20.45, cpa: 474 },
  { date: '2026-03-27', dayOfWeek: '金曜日', impressions: 2039, clicks: 29, ctr: 1.42, cpc: 134, spend: 3877, conversions: 8, cvr: 27.59, cpa: 485 },
  { date: '2026-03-28', dayOfWeek: '土曜日', impressions: 1827, clicks: 37, ctr: 2.03, cpc: 121, spend: 4474, conversions: 7, cvr: 18.92, cpa: 639 },
  { date: '2026-03-29', dayOfWeek: '日曜日', impressions: 1842, clicks: 35, ctr: 1.90, cpc: 119, spend: 4159, conversions: 8, cvr: 22.86, cpa: 520 },
  { date: '2026-03-30', dayOfWeek: '月曜日', impressions: 15466, clicks: 412, ctr: 2.66, cpc: 68, spend: 27937, conversions: 2, cvr: 0.49, cpa: 13969 },
  { date: '2026-03-31', dayOfWeek: '火曜日', impressions: 14958, clicks: 475, ctr: 3.18, cpc: 54, spend: 25730, conversions: 5, cvr: 1.05, cpa: 5146 },
];

export const mockMonthlyData: BreakdownData[] = [
  { label: '2025年8月', impressions: 54064, clicks: 1578, ctr: 2.92, cpc: 20, spend: 32123, conversions: 25, cvr: 1.58, cpa: 1285 },
  { label: '2025年9月', impressions: 21313, clicks: 420, ctr: 1.97, cpc: 69, spend: 29084, conversions: 26, cvr: 6.19, cpa: 1119 },
  { label: '2025年10月', impressions: 40464, clicks: 817, ctr: 2.02, cpc: 73, spend: 59569, conversions: 46, cvr: 5.63, cpa: 1295 },
  { label: '2025年11月', impressions: 37335, clicks: 780, ctr: 2.09, cpc: 76, spend: 58921, conversions: 37, cvr: 4.74, cpa: 1592 },
  { label: '2025年12月', impressions: 52937, clicks: 1700, ctr: 3.21, cpc: 48, spend: 80979, conversions: 51, cvr: 3.0, cpa: 1588 },
  { label: '2026年1月', impressions: 19892, clicks: 590, ctr: 2.97, cpc: 45, spend: 26790, conversions: 16, cvr: 2.71, cpa: 1674 },
  { label: '2026年2月', impressions: 87266, clicks: 2397, ctr: 2.75, cpc: 53, spend: 127816, conversions: 34, cvr: 1.42, cpa: 3759 },
  { label: '2026年3月', impressions: 507467, clicks: 3734, ctr: 0.74, cpc: 43, spend: 161120, conversions: 1256, cvr: 33.64, cpa: 128 },
  { label: '2026年4月', impressions: 10649, clicks: 281, ctr: 2.64, cpc: 60, spend: 16736, conversions: 4, cvr: 1.42, cpa: 4184 },
];

export const mockWeekdayData: BreakdownData[] = [
  { label: '日曜日', impressions: 15466, clicks: 412, ctr: 2.66, cpc: 68, spend: 27937, conversions: 2, cvr: 0.49, cpa: 13969 },
  { label: '月曜日', impressions: 14958, clicks: 475, ctr: 3.18, cpc: 54, spend: 25730, conversions: 5, cvr: 1.05, cpa: 5146 },
  { label: '火曜日', impressions: 113983, clicks: 693, ctr: 0.61, cpc: 43, spend: 29974, conversions: 278, cvr: 40.12, cpa: 108 },
  { label: '水曜日', impressions: 253703, clicks: 1059, ctr: 0.42, cpc: 21, spend: 21826, conversions: 715, cvr: 67.52, cpa: 31 },
  { label: '木曜日', impressions: 84269, clicks: 557, ctr: 0.66, cpc: 35, spend: 19256, conversions: 245, cvr: 43.99, cpa: 79 },
  { label: '金曜日', impressions: 12271, clicks: 294, ctr: 2.4, cpc: 64, spend: 18810, conversions: 7, cvr: 2.38, cpa: 2687 },
  { label: '土曜日', impressions: 12817, clicks: 244, ctr: 1.9, cpc: 72, spend: 17587, conversions: 4, cvr: 1.64, cpa: 4397 },
];

export const mockDeviceData: BreakdownData[] = [
  { label: 'スマートフォン', impressions: 493841, clicks: 3685, ctr: 0.75, cpc: 43, spend: 157329, conversions: 1230, cvr: 33.38, cpa: 128 },
  { label: 'PC', impressions: 13626, clicks: 49, ctr: 0.36, cpc: 77, spend: 3791, conversions: 26, cvr: 53.06, cpa: 146 },
  { label: 'その他', impressions: 0, clicks: 0, ctr: 0, cpc: 0, spend: 0, conversions: 0, cvr: 0, cpa: 0 },
];

export const mockGenderData: BreakdownData[] = [
  { label: '女性', impressions: 31281, clicks: 939, ctr: 3.00, cpc: 77, spend: 72702, conversions: 256, cvr: 27.26, cpa: 284 },
  { label: '男性', impressions: 17624, clicks: 401, ctr: 2.28, cpc: 76, spend: 30513, conversions: 93, cvr: 23.19, cpa: 328 },
  { label: '不明', impressions: 139, clicks: 6, ctr: 4.32, cpc: 60, spend: 357, conversions: 1, cvr: 16.67, cpa: 357 },
];

export const mockAgeData: BreakdownData[] = [
  { label: '45-54', impressions: 10819, clicks: 281, ctr: 2.60, cpc: 72, spend: 20251, conversions: 60, cvr: 21.35, cpa: 338 },
  { label: '55-64', impressions: 21982, clicks: 615, ctr: 2.80, cpc: 75, spend: 45998, conversions: 160, cvr: 26.02, cpa: 287 },
  { label: '35-44', impressions: 1774, clicks: 38, ctr: 2.14, cpc: 92, spend: 3494, conversions: 11, cvr: 28.95, cpa: 318 },
  { label: '65+', impressions: 13079, clicks: 375, ctr: 2.87, cpc: 81, spend: 30511, conversions: 113, cvr: 30.13, cpa: 270 },
  { label: '25-34', impressions: 1301, clicks: 36, ctr: 2.77, cpc: 88, spend: 3166, conversions: 6, cvr: 16.67, cpa: 528 },
  { label: '18-24', impressions: 87, clicks: 1, ctr: 1.15, cpc: 149, spend: 149, conversions: 0, cvr: 0, cpa: 0 },
];

export const mockRegionData: BreakdownData[] = [
  { label: '宮城県', impressions: 5200, clicks: 420, ctr: 8.08, cpc: 15, spend: 6300, conversions: 0, cvr: 0, cpa: 0 },
  { label: '東京都', impressions: 4290, clicks: 165, ctr: 3.85, cpc: 60, spend: 9944, conversions: 0, cvr: 0, cpa: 0 },
  { label: '千葉県', impressions: 3800, clicks: 155, ctr: 4.08, cpc: 48, spend: 7440, conversions: 0, cvr: 0, cpa: 0 },
  { label: '埼玉県', impressions: 3500, clicks: 140, ctr: 4.00, cpc: 45, spend: 6300, conversions: 0, cvr: 0, cpa: 0 },
  { label: '福岡県', impressions: 3200, clicks: 110, ctr: 3.44, cpc: 55, spend: 6050, conversions: 0, cvr: 0, cpa: 0 },
  { label: '大阪府', impressions: 3654, clicks: 107, ctr: 2.93, cpc: 75, spend: 8033, conversions: 0, cvr: 0, cpa: 0 },
  { label: '愛知県', impressions: 2800, clicks: 100, ctr: 3.57, cpc: 60, spend: 6000, conversions: 0, cvr: 0, cpa: 0 },
  { label: '神奈川県', impressions: 2936, clicks: 92, ctr: 3.13, cpc: 72, spend: 6579, conversions: 0, cvr: 0, cpa: 0 },
  { label: '北海道', impressions: 3000, clicks: 85, ctr: 2.83, cpc: 73, spend: 6205, conversions: 0, cvr: 0, cpa: 0 },
  { label: '福島県', impressions: 2200, clicks: 72, ctr: 3.27, cpc: 50, spend: 3600, conversions: 0, cvr: 0, cpa: 0 },
  { label: '山形県', impressions: 1800, clicks: 55, ctr: 3.06, cpc: 52, spend: 2860, conversions: 0, cvr: 0, cpa: 0 },
  { label: '静岡県', impressions: 1583, clicks: 46, ctr: 2.91, cpc: 77, spend: 3555, conversions: 0, cvr: 0, cpa: 0 },
  { label: '岩手県', impressions: 1400, clicks: 40, ctr: 2.86, cpc: 60, spend: 2400, conversions: 0, cvr: 0, cpa: 0 },
  { label: '秋田県', impressions: 1200, clicks: 35, ctr: 2.92, cpc: 55, spend: 1925, conversions: 0, cvr: 0, cpa: 0 },
  { label: '兵庫県', impressions: 1936, clicks: 32, ctr: 1.65, cpc: 70, spend: 2240, conversions: 0, cvr: 0, cpa: 0 },
];

export const mockHourlyData: BreakdownData[] = Array.from({ length: 24 }, (_, h) => {
  const data: Record<number, { impressions: number; clicks: number; ctr: number; cpc: number; spend: number; conversions: number; cpa: number }> = {
    0: { impressions: 1278, clicks: 43, ctr: 3.36, cpc: 69, spend: 2946, conversions: 12, cpa: 246 },
    1: { impressions: 294, clicks: 13, ctr: 4.42, cpc: 54, spend: 704, conversions: 2, cpa: 352 },
    2: { impressions: 141, clicks: 6, ctr: 4.26, cpc: 63, spend: 375, conversions: 2, cpa: 188 },
    3: { impressions: 116, clicks: 5, ctr: 4.31, cpc: 58, spend: 292, conversions: 2, cpa: 146 },
    4: { impressions: 126, clicks: 3, ctr: 2.38, cpc: 83, spend: 249, conversions: 2, cpa: 125 },
    5: { impressions: 185, clicks: 2, ctr: 1.08, cpc: 200, spend: 399, conversions: 0, cpa: 0 },
    6: { impressions: 342, clicks: 8, ctr: 2.34, cpc: 101, spend: 809, conversions: 0, cpa: 0 },
    7: { impressions: 597, clicks: 17, ctr: 2.85, cpc: 70, spend: 1190, conversions: 6, cpa: 198 },
    8: { impressions: 509, clicks: 19, ctr: 3.73, cpc: 61, spend: 1155, conversions: 5, cpa: 231 },
    9: { impressions: 341, clicks: 14, ctr: 4.11, cpc: 59, spend: 829, conversions: 3, cpa: 276 },
    10: { impressions: 3494, clicks: 61, ctr: 1.75, cpc: 133, spend: 8135, conversions: 16, cpa: 508 },
    11: { impressions: 2156, clicks: 77, ctr: 3.57, cpc: 62, spend: 4797, conversions: 21, cpa: 228 },
    12: { impressions: 2599, clicks: 75, ctr: 2.89, cpc: 73, spend: 5490, conversions: 20, cpa: 275 },
    13: { impressions: 2800, clicks: 80, ctr: 2.86, cpc: 70, spend: 5600, conversions: 22, cpa: 255 },
    14: { impressions: 2600, clicks: 72, ctr: 2.77, cpc: 75, spend: 5400, conversions: 19, cpa: 284 },
    15: { impressions: 2400, clicks: 68, ctr: 2.83, cpc: 72, spend: 4896, conversions: 18, cpa: 272 },
    16: { impressions: 2700, clicks: 74, ctr: 2.74, cpc: 78, spend: 5772, conversions: 20, cpa: 289 },
    17: { impressions: 2900, clicks: 82, ctr: 2.83, cpc: 74, spend: 6068, conversions: 23, cpa: 264 },
    18: { impressions: 3200, clicks: 95, ctr: 2.97, cpc: 68, spend: 6460, conversions: 28, cpa: 231 },
    19: { impressions: 3500, clicks: 105, ctr: 3.0, cpc: 65, spend: 6825, conversions: 30, cpa: 228 },
    20: { impressions: 3800, clicks: 115, ctr: 3.03, cpc: 63, spend: 7245, conversions: 33, cpa: 220 },
    21: { impressions: 3600, clicks: 108, ctr: 3.0, cpc: 66, spend: 7128, conversions: 30, cpa: 238 },
    22: { impressions: 3100, clicks: 98, ctr: 3.16, cpc: 68, spend: 6664, conversions: 25, cpa: 267 },
    23: { impressions: 2760, clicks: 86, ctr: 3.12, cpc: 71, spend: 6106, conversions: 21, cpa: 291 },
  };
  const d = data[h] || { impressions: 0, clicks: 0, ctr: 0, cpc: 0, spend: 0, conversions: 0, cpa: 0 };
  return { label: `${h}時`, ...d, cvr: cvr(d.clicks, d.conversions) };
});

export const mockHeatmapData: HourlyHeatmapData[] = [
  { dayOfWeek: '日曜日', hours: { 0: 21, 1: 11, 2: 8, 3: 7, 4: 3, 5: 2, 6: 7, 7: 20, 8: 14, 9: 24, 10: 13, 11: 19, 12: 15 } },
  { dayOfWeek: '月曜日', hours: { 0: 14, 1: 10, 2: 8, 3: 2, 4: 5, 5: 9, 6: 8, 7: 10, 8: 12, 9: 7, 10: 10, 11: 19, 12: 27 } },
  { dayOfWeek: '火曜日', hours: { 0: 16, 1: 17, 2: 16, 3: 6, 4: 7, 5: 9, 6: 15, 7: 25, 8: 12, 9: 10, 10: 14, 11: 13, 12: 14 } },
  { dayOfWeek: '水曜日', hours: { 0: 12, 1: 13, 2: 16, 3: 12, 4: 13, 5: 33, 6: 75, 7: 75, 8: 66, 9: 40, 10: 42, 11: 35, 12: 59 } },
  { dayOfWeek: '木曜日', hours: { 0: 52, 1: 21, 2: 9, 3: 14, 4: 6, 5: 10, 6: 22, 7: 31, 8: 30, 9: 20, 10: 8, 11: 5, 12: 13 } },
  { dayOfWeek: '金曜日', hours: { 0: 11, 1: 4, 2: 3, 3: 4, 4: 4, 5: 5, 6: 0, 7: 7, 8: 7, 9: 11, 10: 9, 11: 10, 12: 21 } },
  { dayOfWeek: '土曜日', hours: { 0: 10, 1: 4, 2: 2, 3: 5, 4: 2, 5: 4, 6: 8, 7: 4, 8: 7, 9: 8, 10: 10, 11: 24, 12: 16 } },
];

export const mockCampaignData: CampaignData[] = [
  { label: 'キャンペーン1', campaignName: 'キャンペーン1', impressions: 45990, clicks: 1084, ctr: 2.36, cpc: 67, spend: 72280, conversions: 10, cvr: 0.92, cpa: 7228 },
  { label: 'キャンペーン2', campaignName: 'キャンペーン2', impressions: 24309, clicks: 639, ctr: 2.63, cpc: 48, spend: 30726, conversions: 8, cvr: 1.25, cpa: 3841 },
  { label: 'キャンペーン3', campaignName: 'キャンペーン3', impressions: 18664, clicks: 547, ctr: 2.93, cpc: 56, spend: 30728, conversions: 6, cvr: 1.1, cpa: 5121 },
  { label: 'キャンペーン4', campaignName: 'キャンペーン4', impressions: 9550, clicks: 238, ctr: 2.49, cpc: 92, spend: 21808, conversions: 6, cvr: 2.52, cpa: 3635 },
];

export const mockAdGroupData: AdGroupData[] = [
  { label: '広告セット1', adGroupName: '広告セット1', campaignName: 'キャンペーン1', impressions: 35274, clicks: 830, ctr: 2.35, cpc: 65, spend: 54140, conversions: 8, cvr: 0.96, cpa: 6768 },
  { label: '広告セット2', adGroupName: '広告セット2', campaignName: 'キャンペーン3', impressions: 18664, clicks: 547, ctr: 2.93, cpc: 56, spend: 30728, conversions: 6, cvr: 1.1, cpa: 5121 },
  { label: '広告セット3', adGroupName: '広告セット3', campaignName: 'キャンペーン4', impressions: 9545, clicks: 237, ctr: 2.48, cpc: 92, spend: 21802, conversions: 6, cvr: 2.53, cpa: 3634 },
  { label: '広告セット4', adGroupName: '広告セット4', campaignName: 'キャンペーン2', impressions: 15688, clicks: 411, ctr: 2.62, cpc: 43, spend: 17816, conversions: 5, cvr: 1.22, cpa: 3563 },
  { label: '広告セット5', adGroupName: '広告セット5', campaignName: 'キャンペーン2', impressions: 8621, clicks: 228, ctr: 2.64, cpc: 57, spend: 12910, conversions: 3, cvr: 1.32, cpa: 4303 },
  { label: '広告セット6', adGroupName: '広告セット6', campaignName: 'キャンペーン1', impressions: 10716, clicks: 254, ctr: 2.37, cpc: 71, spend: 18140, conversions: 2, cvr: 0.79, cpa: 9070 },
  { label: '広告セット7', adGroupName: '広告セット7', campaignName: 'キャンペーン4', impressions: 5, clicks: 1, ctr: 20.0, cpc: 6, spend: 6, conversions: 0, cvr: 0, cpa: 0 },
];

export const mockAdCreatives: AdCreativeData[] = [
  { label: '広告1', adName: '広告1', campaignName: 'キャンペーン1', adGroupName: '広告セット1', impressions: 26975, clicks: 637, ctr: 2.36, cpc: 66, spend: 42079, conversions: 8, cvr: 1.26, cpa: 5260, thumbnailUrl: '' },
  { label: '広告2', adName: '広告2', campaignName: 'キャンペーン2', adGroupName: '広告セット4', impressions: 15688, clicks: 411, ctr: 2.62, cpc: 43, spend: 17816, conversions: 5, cvr: 1.22, cpa: 3563, thumbnailUrl: '' },
  { label: '広告3', adName: '広告3', campaignName: 'キャンペーン4', adGroupName: '広告セット3', impressions: 7552, clicks: 204, ctr: 2.70, cpc: 89, spend: 18255, conversions: 5, cvr: 2.45, cpa: 3651, thumbnailUrl: '' },
  { label: '広告4', adName: '広告4', campaignName: 'キャンペーン3', adGroupName: '広告セット2', impressions: 16513, clicks: 515, ctr: 3.12, cpc: 54, spend: 27768, conversions: 4, cvr: 0.78, cpa: 6942, thumbnailUrl: '' },
  { label: '広告5', adName: '広告5', campaignName: 'キャンペーン2', adGroupName: '広告セット5', impressions: 8621, clicks: 228, ctr: 2.64, cpc: 57, spend: 12910, conversions: 3, cvr: 1.32, cpa: 4303, thumbnailUrl: '' },
  { label: '広告6', adName: '広告6', campaignName: 'キャンペーン1', adGroupName: '広告セット6', impressions: 2077, clicks: 40, ctr: 1.93, cpc: 73, spend: 2907, conversions: 2, cvr: 5.0, cpa: 1454, thumbnailUrl: '' },
  { label: '広告7', adName: '広告7', campaignName: 'キャンペーン4', adGroupName: '広告セット3', impressions: 1993, clicks: 33, ctr: 1.66, cpc: 107, spend: 3547, conversions: 1, cvr: 3.03, cpa: 3547, thumbnailUrl: '' },
  { label: '広告8', adName: '広告8', campaignName: 'キャンペーン3', adGroupName: '広告セット2', impressions: 1500, clicks: 16, ctr: 1.07, cpc: 121, spend: 1928, conversions: 1, cvr: 6.25, cpa: 1928, thumbnailUrl: '' },
  { label: '広告9', adName: '広告9', campaignName: 'キャンペーン3', adGroupName: '広告セット2', impressions: 423, clicks: 15, ctr: 3.55, cpc: 50, spend: 754, conversions: 1, cvr: 6.67, cpa: 754, thumbnailUrl: '' },
];

export const mockAccountSummary = {
  accountName: 'デモアカウント',
  impressions: 507467,
  clicks: 3734,
  ctr: 0.74,
  cpc: 43,
  spend: 161120,
  conversions: 1256,
  cvr: 33.64,
  cpa: 128,
};
