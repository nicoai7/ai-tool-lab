'use client';

import { BreakdownData } from '@/types/meta';
import { formatCurrencyExact, formatPercent } from '@/lib/format';

interface DataTableProps {
  data: BreakdownData[];
  labelHeader: string;
  showConversions?: boolean;
  showBarCharts?: boolean;
}

export default function DataTable({ data, labelHeader, showConversions = true, showBarCharts = true }: DataTableProps) {
  const maxImpressions = Math.max(...data.map(d => d.impressions));
  const maxClicks = Math.max(...data.map(d => d.clicks));
  const maxSpend = Math.max(...data.map(d => d.spend));
  const maxConversions = Math.max(...data.map(d => d.conversions));
  const maxCvr = Math.max(...data.map(d => d.cvr));
  const maxCpc = Math.max(...data.map(d => d.cpc));
  const maxCpa = Math.max(...data.map(d => d.cpa));

  const barWidth = (value: number, max: number): string => {
    return max > 0 ? `${(value / max) * 100}%` : '0%';
  };

  const totals = data.reduce(
    (acc, d) => ({
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
      spend: acc.spend + d.spend,
      conversions: acc.conversions + d.conversions,
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
  );
  const totalCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const totalCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const totalCvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
  const totalCpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;

  const cellClass = "px-4 py-1.5 text-right border-l border-border";
  const headerClass = "px-4 py-2 font-medium whitespace-nowrap text-right border-l border-white/20";

  function MetricCell({ value, barValue, barMax, color }: { value: string; barValue: number; barMax: number; color: string }) {
    return (
      <td className={cellClass}>
        <div className="whitespace-nowrap text-right">{value}</div>
        {showBarCharts && (
          <div className="mt-0.5 h-1.5 bg-gray-100 rounded-full overflow-hidden flex justify-end" style={{ width: '60px', marginLeft: 'auto' }}>
            <div className="h-full rounded-full" style={{ width: barWidth(barValue, barMax), backgroundColor: color }} />
          </div>
        )}
      </td>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-sm" style={{ minWidth: '1200px' }}>
        <thead>
          <tr className="bg-primary text-white">
            <th className="text-left px-4 py-2 font-medium rounded-tl-lg whitespace-nowrap" style={{ minWidth: '160px' }}>{labelHeader}</th>
            <th className={headerClass} style={{ minWidth: '130px' }}>表示回数</th>
            <th className={headerClass} style={{ minWidth: '110px' }}>クリック数</th>
            <th className={headerClass} style={{ minWidth: '100px' }}>クリック率</th>
            <th className={headerClass} style={{ minWidth: '110px' }}>クリック単価</th>
            <th className={headerClass} style={{ minWidth: '120px' }}>ご利用金額</th>
            {showConversions && (
              <>
                <th className={headerClass} style={{ minWidth: '110px' }}>獲得件数</th>
                <th className={headerClass} style={{ minWidth: '100px' }}>獲得率</th>
                <th className={`${headerClass} rounded-tr-lg`} style={{ minWidth: '110px' }}>獲得単価</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-border hover:bg-gray-50 transition-colors">
              <td className="px-4 py-1.5 font-medium whitespace-nowrap">{row.label}</td>
              <MetricCell value={row.impressions.toLocaleString()} barValue={row.impressions} barMax={maxImpressions} color="#4361ee" />
              <MetricCell value={row.clicks.toLocaleString()} barValue={row.clicks} barMax={maxClicks} color="#ef4444" />
              <MetricCell value={formatPercent(row.ctr)} barValue={row.ctr} barMax={10} color="#f59e0b" />
              <MetricCell value={formatCurrencyExact(row.cpc)} barValue={row.cpc} barMax={maxCpc} color="#10b981" />
              <MetricCell value={formatCurrencyExact(row.spend)} barValue={row.spend} barMax={maxSpend} color="#8b5cf6" />
              {showConversions && (
                <>
                  <MetricCell value={row.conversions.toLocaleString()} barValue={row.conversions} barMax={maxConversions} color="#06b6d4" />
                  <MetricCell value={formatPercent(row.cvr)} barValue={row.cvr} barMax={maxCvr > 0 ? maxCvr : 100} color="#f97316" />
                  <MetricCell value={row.cpa > 0 ? formatCurrencyExact(Math.round(row.cpa)) : '-'} barValue={row.cpa} barMax={maxCpa > 0 ? maxCpa : 1} color="#84cc16" />
                </>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-bold">
            <td className="px-4 py-1.5">総計</td>
            <td className={cellClass}>{totals.impressions.toLocaleString()}</td>
            <td className={cellClass}>{totals.clicks.toLocaleString()}</td>
            <td className={cellClass}>{formatPercent(totalCtr)}</td>
            <td className={cellClass}>{formatCurrencyExact(Math.round(totalCpc))}</td>
            <td className={cellClass}>{formatCurrencyExact(totals.spend)}</td>
            {showConversions && (
              <>
                <td className={cellClass}>{totals.conversions.toLocaleString()}</td>
                <td className={cellClass}>{formatPercent(totalCvr)}</td>
                <td className={cellClass}>{totalCpa > 0 ? formatCurrencyExact(Math.round(totalCpa)) : '-'}</td>
              </>
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
