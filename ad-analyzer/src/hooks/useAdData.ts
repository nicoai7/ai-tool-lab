'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BreakdownData, DailyData } from '@/types/meta';
import * as transform from '@/lib/transform';

import {
  mockDailyData, mockMonthlyData, mockWeekdayData, mockHourlyData,
  mockDeviceData, mockGenderData, mockAgeData, mockRegionData,
  mockCampaignData, mockAdGroupData, mockAdCreatives,
  mockAccountSummary, mockKPIs, mockConversionKPIs, mockCostKPIs,
} from '@/lib/mock-data';

type BreakdownType = 'summary' | 'daily' | 'monthly' | 'weekday' | 'hourly' | 'device' | 'gender' | 'age' | 'region' | 'campaign' | 'adset' | 'ad';

interface UseAdDataResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  isDemo: boolean;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

async function fetchFromAPI(breakdown: string, dateRange: DateRange): Promise<any[]> {
  const params = new URLSearchParams({
    breakdown,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  const res = await fetch(`/api/insights?${params}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'データの取得に失敗しました');
  }
  const json = await res.json();
  return json.data;
}

// 実データ取得可能かどうか（接続済み＋アカウント選択済み）
function useCanFetchReal() {
  const { isAuthenticated, accountId } = useAuth();
  return isAuthenticated && !!accountId;
}

export function useDailyData(dateRange: DateRange): UseAdDataResult<DailyData[]> {
  const canFetch = useCanFetchReal();
  const [data, setData] = useState<DailyData[]>(mockDailyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!canFetch) { setData(mockDailyData); return; }
    setLoading(true);
    setError(null);
    try {
      const raw = await fetchFromAPI('daily', dateRange);
      if (raw.length > 0) {
        setData(transform.toDailyData(raw));
      } else {
        setData(mockDailyData);
      }
    } catch (e: any) {
      setError(e.message);
      setData(mockDailyData);
    } finally {
      setLoading(false);
    }
  }, [canFetch, dateRange.startDate, dateRange.endDate]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch, isDemo: !canFetch };
}

export function useBreakdownData(
  type: BreakdownType,
  dateRange: DateRange,
  labelFn?: (item: any) => string
): UseAdDataResult<BreakdownData[]> {
  const canFetch = useCanFetchReal();

  const mockMap: Record<string, BreakdownData[]> = {
    monthly: mockMonthlyData,
    weekday: mockWeekdayData,
    hourly: mockHourlyData,
    device: mockDeviceData,
    gender: mockGenderData,
    age: mockAgeData,
    region: mockRegionData,
    campaign: mockCampaignData,
    adset: mockAdGroupData,
    ad: mockAdCreatives,
  };

  const labelFnMap: Record<string, (item: any) => string> = {
    monthly: transform.monthLabel,
    hourly: transform.hourLabel,
    device: transform.deviceLabel,
    gender: transform.genderLabel,
    age: transform.ageLabel,
    region: transform.regionLabel,
    campaign: transform.campaignLabel,
    adset: transform.adsetLabel,
    ad: transform.adLabel,
  };

  const [data, setData] = useState<BreakdownData[]>(mockMap[type] || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!canFetch) {
      setData(mockMap[type] || []);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (type === 'weekday') {
        const raw = await fetchFromAPI('daily', dateRange);
        const daily = transform.toDailyData(raw);
        setData(transform.aggregateByWeekday(daily));
      } else {
        const raw = await fetchFromAPI(type, dateRange);
        if (raw.length > 0) {
          const fn = labelFn || labelFnMap[type] || ((item: any) => item.date_start || '');
          setData(transform.toBreakdownData(raw, fn));
        } else {
          setData(mockMap[type] || []);
        }
      }
    } catch (e: any) {
      setError(e.message);
      setData(mockMap[type] || []);
    } finally {
      setLoading(false);
    }
  }, [canFetch, type, dateRange.startDate, dateRange.endDate]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch, isDemo: !canFetch };
}

export function useAccountSummary(dateRange: DateRange) {
  const canFetch = useCanFetchReal();
  const { accountName } = useAuth();
  const [data, setData] = useState(mockAccountSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!canFetch) { setData(mockAccountSummary); return; }
    setLoading(true);
    try {
      const raw = await fetchFromAPI('summary', dateRange);
      const summary = transform.toAccountSummary(raw, accountName || '');
      if (summary) {
        setData(summary);
      } else {
        setData(mockAccountSummary);
      }
    } catch (e: any) {
      setError(e.message);
      setData(mockAccountSummary);
    } finally {
      setLoading(false);
    }
  }, [canFetch, dateRange.startDate, dateRange.endDate, accountName]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch, isDemo: !canFetch };
}

export function useKPIs() {
  const canFetch = useCanFetchReal();
  return {
    kpis: mockKPIs,
    conversionKPIs: mockConversionKPIs,
    costKPIs: mockCostKPIs,
    isDemo: !canFetch,
  };
}
