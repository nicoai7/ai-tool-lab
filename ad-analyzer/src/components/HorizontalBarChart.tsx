'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface HorizontalBarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  title: string;
  height?: number;
}

export default function HorizontalBarChart({ data, title, height = 200 }: HorizontalBarChartProps) {
  return (
    <div className="bg-card-bg rounded-xl border border-border p-5">
      <h4 className="text-sm font-semibold mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="value" fill="#4361ee" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
