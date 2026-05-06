'use client';

import { KPIData } from '@/types/meta';
import { formatKPIValue, formatChangePercent } from '@/lib/format';

interface KPICardProps {
  data: KPIData;
  invertColor?: boolean; // CPAなど「下がった方が良い」指標用
}

export default function KPICard({ data, invertColor = false }: KPICardProps) {
  const change = formatChangePercent(data.changePercent);

  // コスト系指標は下がると良い（緑）、上がると悪い（赤）
  let colorClass: string;
  if (data.changePercent === undefined) {
    colorClass = 'text-muted';
  } else if (invertColor) {
    colorClass = change.isPositive ? 'text-danger' : 'text-success';
  } else {
    colorClass = change.isPositive ? 'text-success' : 'text-danger';
  }

  return (
    <div className="bg-card-bg rounded-xl border border-border p-5">
      <p className="text-xs text-muted font-medium mb-1">{data.label}</p>
      <p className="text-2xl font-bold tracking-tight">
        {formatKPIValue(data.value, data.format)}
      </p>
      {data.changePercent !== undefined && (
        <p className={`text-xs mt-1 font-medium ${colorClass}`}>
          {change.text}
        </p>
      )}
    </div>
  );
}
