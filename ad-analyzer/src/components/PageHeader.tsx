'use client';

import { useState } from 'react';
import DateRangePicker from './DateRangePicker';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  onDateChange?: (start: string, end: string) => void;
  isDemo?: boolean;
  loading?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  startDate: controlledStart,
  endDate: controlledEnd,
  onDateChange,
  isDemo,
  loading,
}: PageHeaderProps) {
  const [internalStart, setInternalStart] = useState('2026-03-01');
  const [internalEnd, setInternalEnd] = useState('2026-03-31');

  const start = controlledStart ?? internalStart;
  const end = controlledEnd ?? internalEnd;

  const handleChange = (s: string, e: string) => {
    if (onDateChange) {
      onDateChange(s, e);
    } else {
      setInternalStart(s);
      setInternalEnd(e);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
          </div>
          {loading && (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
          {isDemo && (
            <span className="text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
              DEMO
            </span>
          )}
        </div>
        <DateRangePicker startDate={start} endDate={end} onChange={handleChange} />
      </div>
    </div>
  );
}
