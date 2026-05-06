'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BreakdownData, DailyData } from '@/types/meta';
import * as transform from '@/lib/transform';
import { apiUrl } from '@/lib/api-url';

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

async function fetchFromAPI(breakdown: string, dateRange: DateRange, signal?: AbortSignal): Promise<unknown[]> {
  const params = new URLSearchParams({
    breakdown,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  const res = await fetch(`${apiUrl('/api/insights')}?${params}`, { signal });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'データの取得に失敗しました');
  }
  const json = await res.json();
  return json.data;
}

// 認証ローディング中は null を返し、確定後に boolean を返す
function useCanFetchReal(): boolean | null {
  const { isAuthenticated, accountId, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated && !!accountId;
}

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError';
}

export function useDailyData(dateRange: DateRange): UseAdDataResult<DailyData[]> {
  const canFetch = useCanFetchReal();
  const [data, setData] = useState<DailyData[]>(mockDailyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (signal?: AbortSignal) => {
    if (canFetch === null) return;
    if (!canFetch) { setData(mockDailyData); return; }
    setLoading(true);
    setError(null);
    try {
      const raw = await fetchFromAPI('daily', dateRange, signal);
      setData(raw.length > 0 ? transform.toDailyData(raw as unknown[]) : mockDailyData);
    } catch (e) {
      if (isAbortError(e)) return;
      setError((e as Error).message);
      setData(mockDailyData);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [canFetch, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    const controller = new AbortController();
    refetch(controller.signal);
    return () => controller.abort();
  }, [refetch]);

  return { data, loading, error, refetch: () => refetch(), isDemo: canFetch === false };
}

export function useBreakdownData(
  type: BreakdownType,
  dateRange: DateRange,
  labelFn?: (item: unknown) => string
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

  const labelFnMap: Record<string, (item: unknown) => string> = {
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

  const refetch = useCallback(async (signal?: AbortSignal) => {
    if (canFetch === null) return;
    if (!canFetch) {
      setData(mockMap[type] || []);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (type === 'weekday') {
        const raw = await fetchFromAPI('daily', dateRange, signal);
        const daily = transform.toDailyData(raw as unknown[]);
        setData(transform.aggregateByWeekday(daily));
      } else {
        const raw = await fetchFromAPI(type, dateRange, signal);
        if (raw.length > 0) {
          const fn = labelFn || labelFnMap[type] || ((item: unknown) => (item as { date_start?: string }).date_start || '');
          setData(transform.toBreakdownData(raw as unknown[], fn));
        } else {
          setData(mockMap[type] || []);
        }
      }
    } catch (e) {
      if (isAbortError(e)) return;
      setError((e as Error).message);
      setData(mockMap[type] || []);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
    // mockMap, labelFnMap, labelFn は依存に含めずクロージャで参照（識別性は type で取れるため）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, type, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    const controller = new AbortController();
    refetch(controller.signal);
    return () => controller.abort();
  }, [refetch]);

  return { data, loading, error, refetch: () => refetch(), isDemo: canFetch === false };
}

export function useAccountSummary(dateRange: DateRange) {
  const canFetch = useCanFetchReal();
  const { accountName } = useAuth();
  const [data, setData] = useState(mockAccountSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (signal?: AbortSignal) => {
    if (canFetch === null) return;
    if (!canFetch) { setData(mockAccountSummary); return; }
    setLoading(true);
    try {
      const raw = await fetchFromAPI('summary', dateRange, signal);
      const summary = transform.toAccountSummary(raw as unknown[], accountName || '');
      setData(summary || mockAccountSummary);
    } catch (e) {
      if (isAbortError(e)) return;
      setError((e as Error).message);
      setData(mockAccountSummary);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [canFetch, dateRange.startDate, dateRange.endDate, accountName]);

  useEffect(() => {
    const controller = new AbortController();
    refetch(controller.signal);
    return () => controller.abort();
  }, [refetch]);

  return { data, loading, error, refetch: () => refetch(), isDemo: canFetch === false };
}

export function useKPIs() {
  const canFetch = useCanFetchReal();
  return {
    kpis: mockKPIs,
    conversionKPIs: mockConversionKPIs,
    costKPIs: mockCostKPIs,
    isDemo: canFetch === false,
  };
}
