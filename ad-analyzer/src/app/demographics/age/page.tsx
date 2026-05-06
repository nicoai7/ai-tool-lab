'use client';

import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import DualAxisChart from '@/components/DualAxisChart';
import ExportButton from '@/components/ExportButton';
import { useDateRange } from '@/hooks/useDateRange';
import { useBreakdownData } from '@/hooks/useAdData';
import { exportBreakdownToCSV, exportBreakdownToExcel } from '@/lib/export';
import { exportBreakdownToPptx } from '@/lib/export-pptx';

export default function AgePage() {
  const { dateRange, onChange, startDate, endDate } = useDateRange();
  const { data, loading, isDemo } = useBreakdownData('age', dateRange);

  const chartData = data.map(d => ({
    age: d.label,
    表示回数: d.impressions,
    クリック率: d.ctr,
    クリック数: d.clicks,
    クリック単価: d.cpc,
    獲得件数: d.conversions,
    獲得単価: d.cpa,
    ご利用金額: d.spend,
    獲得率: d.cvr,
  }));

  return (
    <div>
      <PageHeader title="広告レポート - 年齢" startDate={startDate} endDate={endDate} onDateChange={onChange} isDemo={isDemo} loading={loading} />

      <div className="flex justify-end mb-3">
        <ExportButton
          onCSV={() => exportBreakdownToCSV(data, '年齢', '広告レポート_年齢別')}
          onExcel={() => exportBreakdownToExcel(data, '年齢', '広告レポート_年齢別', '年齢別')}
          onPptx={() => exportBreakdownToPptx(data, '広告レポート - 年齢別', '年齢', '広告レポート_年齢別')}
        />
      </div>

      <div className="bg-card-bg rounded-xl border border-border overflow-hidden mb-8">
        <DataTable data={data} labelHeader="年齢" />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <div>
          <h3 className="text-sm font-semibold text-muted mb-3">表示回数 & クリック率</h3>
          <DualAxisChart data={chartData} xKey="age" leftKey="表示回数" rightKey="クリック率" leftLabel="表示回数" rightLabel="クリック率" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-muted mb-3">獲得件数 & 獲得単価</h3>
          <DualAxisChart data={chartData} xKey="age" leftKey="獲得件数" rightKey="獲得単価" leftLabel="獲得件数" rightLabel="獲得単価" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-muted mb-3">クリック数 & クリック単価</h3>
          <DualAxisChart data={chartData} xKey="age" leftKey="クリック数" rightKey="クリック単価" leftLabel="クリック数" rightLabel="クリック単価" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-muted mb-3">ご利用金額 & 獲得率</h3>
          <DualAxisChart data={chartData} xKey="age" leftKey="ご利用金額" rightKey="獲得率" leftLabel="ご利用金額" rightLabel="獲得率" />
        </div>
      </div>
    </div>
  );
}
