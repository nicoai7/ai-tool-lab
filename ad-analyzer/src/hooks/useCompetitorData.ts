'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CompetitorAd, mockCompetitors } from '@/lib/mock-competitors';

const CACHE_KEY = 'competitor_analysis_cache';

interface CachedData {
  data: CompetitorAd[];
  mode: 'auto' | 'manual';
}

function loadCache(): CachedData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCache(data: CompetitorAd[], mode: 'auto' | 'manual') {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, mode }));
  } catch {}
}

function clearCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch {}
}

interface UseCompetitorDataResult {
  data: CompetitorAd[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  fetchManual: (genre: string, description: string) => void;
  isDemo: boolean;
  mode: 'auto' | 'manual' | 'demo';
}

export function useCompetitorData(): UseCompetitorDataResult {
  const { isAuthenticated, accountId } = useAuth();
  const canFetch = isAuthenticated && !!accountId;

  const cached = loadCache();

  const [data, setData] = useState<CompetitorAd[]>(cached ? cached.data : mockCompetitors);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'auto' | 'manual' | 'demo'>(cached ? cached.mode : 'demo');

  // 自動分析
  const refetch = useCallback(async () => {
    if (!canFetch) {
      setError('広告アカウントを接続してください');
      return;
    }
    setLoading(true);
    setError(null);
    setMode('auto');
    clearCache();
    try {
      const res = await fetch('/ad-analyzer/api/competitors');
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || '競合分析の取得に失敗しました');
      }

      if (json.data && json.data.length > 0) {
        setData(json.data);
        saveCache(json.data, 'auto');
      } else {
        throw new Error('広告ライブラリから広告が見つかりませんでした');
      }
    } catch (e: any) {
      setError(e.message);
      // エラー時はモックにフォールバックしない（エラーを表示）
    } finally {
      setLoading(false);
    }
  }, [canFetch]);

  // 手動分析
  const fetchManual = useCallback(async (genre: string, description: string) => {
    setLoading(true);
    setError(null);
    setMode('manual');
    clearCache();
    try {
      const res = await fetch('/ad-analyzer/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, description }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || '競合分析の生成に失敗しました');
      }

      if (json.data && json.data.length > 0) {
        setData(json.data);
        saveCache(json.data, 'manual');
      } else {
        throw new Error('広告が見つかりませんでした。別のキーワードをお試しください。');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, refetch, fetchManual, isDemo: mode === 'demo', mode };
}
