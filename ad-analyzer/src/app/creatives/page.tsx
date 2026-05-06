'use client';

import PageHeader from '@/components/PageHeader';
import ExportButton from '@/components/ExportButton';
import { mockAdCreatives } from '@/lib/mock-data';
import DualAxisChart from '@/components/DualAxisChart';
import { formatCurrencyExact, formatPercent } from '@/lib/format';
import { exportToCSV, exportBreakdownToExcel } from '@/lib/export';
import { exportBreakdownToPptx } from '@/lib/export-pptx';
import { useDateRange } from '@/hooks/useDateRange';
import { useBreakdownData } from '@/hooks/useAdData';

function BarCell({ value, barValue, barMax, color }: { value: string; barValue: number; barMax: number; color: string }) {
  const w = barMax > 0 ? `${(barValue / barMax) * 100}%` : '0%';
  return (
    <td className="px-4 py-1.5 text-right border-l border-border">
      <div className="whitespace-nowrap text-right">{value}</div>
      <div className="mt-0.5 h-1.5 bg-gray-100 rounded-full overflow-hidden" style={{ width: '60px', marginLeft: 'auto' }}>
        <div className="h-full rounded-full" style={{ width: w, backgroundColor: color }} />
      </div>
    </td>
  );
}

export default function CreativesPage() {
  const { dateRange, onChange, startDate, endDate } = useDateRange();
  const { data: breakdownData, loading, isDemo } = useBreakdownData('ad', dateRange);

  const data = isDemo
    ? mockAdCreatives
    : breakdownData.map(d => ({ ...d, adName: d.label, campaignName: '', adGroupName: '', thumbnailUrl: '' }));

  const chartData = data.map(d => ({ name: d.label, 表示回数: d.impressions, クリック率: d.ctr, クリック数: d.clicks, クリック単価: d.cpc, 獲得件数: d.conversions, 獲得単価: d.cpa, ご利用金額: d.spend, 獲得率: d.cvr }));

  const maxImpressions = Math.max(...data.map(d => d.impressions));
  const maxClicks = Math.max(...data.map(d => d.clicks));
  const maxSpend = Math.max(...data.map(d => d.spend));
  const maxConversions = Math.max(...data.map(d => d.conversions));
  const maxCvr = Math.max(...data.map(d => d.cvr));
  const maxCpc = Math.max(...data.map(d => d.cpc));
  const maxCpa = Math.max(...data.map(d => d.cpa));

  const totals = data.reduce(
    (acc, a) => ({ impressions: acc.impressions + a.impressions, clicks: acc.clicks + a.clicks, spend: acc.spend + a.spend, conversions: acc.conversions + a.conversions }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
  );
  const totalCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const totalCpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const totalCvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
  const totalCpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;

  const handleCSV = () => {
    const headers = ['広告名', 'キャンペーン', '広告グループ', '表示回数', 'クリック数', 'クリック率', 'クリック単価', 'ご利用金額', '獲得件数', '獲得率', '獲得単価'];
    const rows = data.map(ad => [ad.adName, ad.campaignName, ad.adGroupName, ad.impressions, ad.clicks, `${ad.ctr}%`, `¥${ad.cpc}`, `¥${ad.spend}`, ad.conversions, `${ad.cvr}%`, ad.cpa > 0 ? `¥${Math.round(ad.cpa)}` : '-']);
    exportToCSV(headers, rows, '広告レポート_広告別');
  };
  const handleExcel = () => exportBreakdownToExcel(data, '広告名', '広告レポート_広告別', '広告別');
  const handlePptx = () => exportBreakdownToPptx(data, '広告レポート - 広告別', '広告名', '広告レポート_広告別');

  const cellClass = "px-4 py-1.5 text-right border-l border-border";
  const headerClass = "px-4 py-2 font-medium whitespace-nowrap text-right border-l border-white/20";

  return (
    <div>
      <PageHeader title="広告レポート - 広告" startDate={startDate} endDate={endDate} onDateChange={onChange} isDemo={isDemo} loading={loading} />
      <div className="flex justify-end mb-3">
        <ExportButton onCSV={handleCSV} onExcel={handleExcel} onPptx={handlePptx} />
      </div>

      <div className="bg-card-bg rounded-xl border border-border overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="text-sm" style={{ minWidth: '1400px' }}>
            <thead>
              <tr className="bg-primary text-white">
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap" style={{ minWidth: '50px' }}>バナー</th>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap border-l border-white/20" style={{ minWidth: '120px' }}>広告名</th>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap border-l border-white/20" style={{ minWidth: '120px' }}>キャンペーン</th>
                <th className="text-left px-3 py-2 font-medium whitespace-nowrap border-l border-white/20" style={{ minWidth: '120px' }}>広告グループ</th>
                <th className={headerClass} style={{ minWidth: '120px' }}>表示回数</th>
                <th className={headerClass} style={{ minWidth: '100px' }}>クリック数</th>
                <th className={headerClass} style={{ minWidth: '90px' }}>クリック率</th>
                <th className={headerClass} style={{ minWidth: '100px' }}>クリック単価</th>
                <th className={headerClass} style={{ minWidth: '110px' }}>ご利用金額</th>
                <th className={headerClass} style={{ minWidth: '100px' }}>獲得件数</th>
                <th className={headerClass} style={{ minWidth: '90px' }}>獲得率</th>
                <th className={headerClass} style={{ minWidth: '100px' }}>獲得単価</th>
              </tr>
            </thead>
            <tbody>
              {data.map((ad, i) => (
                <tr key={i} className="border-b border-border hover:bg-gray-50">
                  <td className="px-3 py-1">
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-muted">
                      {ad.thumbnailUrl ? (
                        <img src={ad.thumbnailUrl} alt="" className="w-full h-full object-cover rounded" />
                      ) : (
                        <span className="text-[8px]">No Image</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 font-medium whitespace-nowrap border-l border-border">{ad.adName}</td>
                  <td className="px-3 py-1.5 text-muted text-xs whitespace-nowrap border-l border-border">{ad.campaignName}</td>
                  <td className="px-3 py-1.5 text-muted text-xs whitespace-nowrap border-l border-border">{ad.adGroupName}</td>
                  <BarCell value={ad.impressions.toLocaleString()} barValue={ad.impressions} barMax={maxImpressions} color="#4361ee" />
                  <BarCell value={ad.clicks.toLocaleString()} barValue={ad.clicks} barMax={maxClicks} color="#ef4444" />
                  <BarCell value={formatPercent(ad.ctr)} barValue={ad.ctr} barMax={10} color="#f59e0b" />
                  <BarCell value={formatCurrencyExact(ad.cpc)} barValue={ad.cpc} barMax={maxCpc} color="#10b981" />
                  <BarCell value={formatCurrencyExact(ad.spend)} barValue={ad.spend} barMax={maxSpend} color="#8b5cf6" />
                  <BarCell value={ad.conversions.toLocaleString()} barValue={ad.conversions} barMax={maxConversions} color="#06b6d4" />
                  <BarCell value={formatPercent(ad.cvr)} barValue={ad.cvr} barMax={maxCvr > 0 ? maxCvr : 100} color="#f97316" />
                  <BarCell value={ad.cpa > 0 ? formatCurrencyExact(Math.round(ad.cpa)) : '-'} barValue={ad.cpa} barMax={maxCpa > 0 ? maxCpa : 1} color="#84cc16" />
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td className="px-3 py-1.5" colSpan={4}>総計</td>
                <td className={cellClass}>{totals.impressions.toLocaleString()}</td>
                <td className={cellClass}>{totals.clicks.toLocaleString()}</td>
                <td className={cellClass}>{formatPercent(totalCtr)}</td>
                <td className={cellClass}>{formatCurrencyExact(Math.round(totalCpc))}</td>
                <td className={cellClass}>{formatCurrencyExact(totals.spend)}</td>
                <td className={cellClass}>{totals.conversions.toLocaleString()}</td>
                <td className={cellClass}>{formatPercent(totalCvr)}</td>
                <td className={cellClass}>{totalCpa > 0 ? formatCurrencyExact(Math.round(totalCpa)) : '-'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <div><h3 className="text-sm font-semibold text-muted mb-3">表示回数 & クリック率</h3><DualAxisChart data={chartData} xKey="name" leftKey="表示回数" rightKey="クリック率" leftLabel="表示回数" rightLabel="クリック率" /></div>
        <div><h3 className="text-sm font-semibold text-muted mb-3">獲得件数 & 獲得単価</h3><DualAxisChart data={chartData} xKey="name" leftKey="獲得件数" rightKey="獲得単価" leftLabel="獲得件数" rightLabel="獲得単価" /></div>
        <div><h3 className="text-sm font-semibold text-muted mb-3">クリック数 & クリック単価</h3><DualAxisChart data={chartData} xKey="name" leftKey="クリック数" rightKey="クリック単価" leftLabel="クリック数" rightLabel="クリック単価" /></div>
        <div><h3 className="text-sm font-semibold text-muted mb-3">ご利用金額 & 獲得率</h3><DualAxisChart data={chartData} xKey="name" leftKey="ご利用金額" rightKey="獲得率" leftLabel="ご利用金額" rightLabel="獲得率" /></div>
      </div>
    </div>
  );
}
