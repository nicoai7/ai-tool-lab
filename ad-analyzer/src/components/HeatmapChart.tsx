'use client';

import { HourlyHeatmapData } from '@/types/meta';

interface HeatmapChartProps {
  data: HourlyHeatmapData[];
}

function getColor(value: number, max: number): string {
  if (value === 0 || !value) return '#f9fafb';
  const intensity = Math.min(value / max, 1);
  const r = Math.round(240 - intensity * 180);
  const g = Math.round(245 - intensity * 160);
  const b = Math.round(255);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function HeatmapChart({ data }: HeatmapChartProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const allValues = data.flatMap(d => hours.map(h => d.hours[h] || 0));
  const max = Math.max(...allValues, 1);

  return (
    <div className="bg-card-bg rounded-xl border border-border p-5">
      <h4 className="text-sm font-semibold mb-3">時間 / クリック数</h4>
      <div className="overflow-x-auto">
        <table className="text-xs w-full">
          <thead>
            <tr>
              <th className="text-left py-1 px-2 font-medium text-muted bg-primary text-white rounded-tl">曜日</th>
              {hours.map(h => (
                <th key={h} className="py-1 px-1 font-medium text-center bg-primary text-white min-w-[28px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.dayOfWeek}>
                <td className="py-1 px-2 font-medium whitespace-nowrap">{row.dayOfWeek}</td>
                {hours.map(h => {
                  const val = row.hours[h] || 0;
                  return (
                    <td
                      key={h}
                      className="py-1 px-1 text-center"
                      style={{ backgroundColor: getColor(val, max) }}
                      title={`${row.dayOfWeek} ${h}時: ${val}`}
                    >
                      {val > 0 ? val : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
