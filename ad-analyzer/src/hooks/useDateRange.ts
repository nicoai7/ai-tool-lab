'use client';

import { useState, useCallback } from 'react';

export interface DateRange {
  startDate: string;
  endDate: string;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDefaultRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { start: formatDate(start), end: formatDate(end) };
}

export function useDateRange(defaultStart?: string, defaultEnd?: string) {
  const defaults = getDefaultRange();

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: defaultStart ?? defaults.start,
    endDate: defaultEnd ?? defaults.end,
  });

  const onChange = useCallback((startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  }, []);

  return { dateRange, onChange, startDate: dateRange.startDate, endDate: dateRange.endDate };
}
