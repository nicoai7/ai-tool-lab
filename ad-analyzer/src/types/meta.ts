// Meta Marketing API のデータ型定義

export interface MetaInsight {
  date_start: string;
  date_stop: string;
  impressions: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  spend: string;
  actions?: MetaAction[];
  cost_per_action_type?: MetaAction[];
  reach?: string;
  frequency?: string;
}

export interface MetaAction {
  action_type: string;
  value: string;
}

export interface CampaignInsight extends MetaInsight {
  campaign_id: string;
  campaign_name: string;
  objective: string;
  status: string;
}

export interface AdSetInsight extends MetaInsight {
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
}

export interface AdInsight extends MetaInsight {
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  campaign_name: string;
  adset_id: string;
  adset_name: string;
}

export interface AdCreative {
  id: string;
  name: string;
  thumbnail_url?: string;
  image_url?: string;
  video_id?: string;
  body?: string;
  title?: string;
}

// ダッシュボード表示用の加工済みデータ型

export interface KPIData {
  label: string;
  value: number;
  previousValue?: number;
  changePercent?: number;
  format: 'number' | 'percent' | 'currency' | 'currency_decimal';
}

export interface DailyData {
  date: string;
  dayOfWeek: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  conversions: number;
  cvr: number;
  cpa: number;
}

export interface BreakdownData {
  label: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  conversions: number;
  cvr: number;
  cpa: number;
}

export interface CampaignData extends BreakdownData {
  campaignName: string;
}

export interface AdGroupData extends BreakdownData {
  adGroupName: string;
  campaignName: string;
}

export interface HourlyHeatmapData {
  dayOfWeek: string;
  hours: { [hour: number]: number };
}

export interface AdCreativeData extends BreakdownData {
  adName: string;
  campaignName: string;
  adGroupName: string;
  thumbnailUrl?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface MetaAdAccount {
  id: string;
  name: string;
  account_id: string;
  currency: string;
  timezone_name: string;
}
