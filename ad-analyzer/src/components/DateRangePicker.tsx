'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

const presets = [
  { label: '今月', getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: fmt(start), end: fmt(now) };
  }},
  { label: '先月', getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: fmt(start), end: fmt(end) };
  }},
  { label: '直近7日', getRange: () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { start: fmt(start), end: fmt(now) };
  }},
  { label: '直近30日', getRange: () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    return { start: fmt(start), end: fmt(now) };
  }},
];

function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm hover:bg-gray-50 transition-colors"
      >
        <Calendar size={14} className="text-muted" />
        <span>{startDate} ~ {endDate}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 bg-white border border-border rounded-lg shadow-lg p-4 z-50 min-w-[320px]">
            <div className="flex gap-2 mb-4">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    const range = preset.getRange();
                    onChange(range.start, range.end);
                    setIsOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs bg-primary-light text-primary rounded-md hover:bg-primary hover:text-white transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => onChange(e.target.value, endDate)}
                className="border border-border rounded px-2 py-1.5 text-sm flex-1"
              />
              <span className="text-muted text-sm">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onChange(startDate, e.target.value)}
                className="border border-border rounded px-2 py-1.5 text-sm flex-1"
              />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full py-1.5 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors"
            >
              適用
            </button>
          </div>
        </>
      )}
    </div>
  );
}
