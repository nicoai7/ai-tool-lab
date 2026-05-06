'use client';

import PageHeader from '@/components/PageHeader';
import KPICard from '@/components/KPICard';
import DualAxisChart from '@/components/DualAxisChart';
import ExportButton from '@/components/ExportButton';
import { useDateRange } from '@/hooks/useDateRange';
import { useDailyData, useAccountSummary, useKPIs } from '@/hooks/useAdData';
import { formatCurrencyExact, formatPercent } from '@/lib/format';
import { exportToCSV, exportAllReportsToExcel } from '@/lib/export';
import { exportAllToPptx } from '@/lib/export-pptx';
import {
  mockMonthlyData, mockWeekdayData, mockHourlyData,
  mockDeviceData, mockGenderData, mockAgeData, mockCampaignData,
} from '@/lib/mock-data';

export default function DashboardPage() {
  const { dateRange, onChange, startDate, endDate } = useDateRange();
  const { data: dailyData, loading: dailyLoading, isDemo } = useDailyData(dateRange);
  const { data: accountSummary } = useAccountSummary(dateRange);
  const { kpis, conversionKPIs, costKPIs } = useKPIs();

  const chartData = dailyData.map(d => ({
    date: d.date.slice(5).replace('-', '/'),
    クリック数: d.clicks,
    クリック率: d.ctr,
    獲得件数: d.conversions,
    獲得率: d.cvr,
    ご利用金額: d.spend,
    クリック単価: d.cpc,
  }));

  const handleExport = () => {
    const headers = ['アカウント名', '表示回数', 'クリック数', 'クリック率', 'クリック単価', 'ご利用金額', '獲得件数', '獲得率', '獲得単価'];
    const rows = [[
      accountSummary.accountName,
      accountSummary.impressions,
      accountSummary.clicks,
      `${accountSummary.ctr}%`,
      `¥${accountSummary.cpc}`,
      `¥${accountSummary.spend}`,
      accountSummary.conversions,
      `${accountSummary.cvr}%`,
      `¥${accountSummary.cpa}`,
    ]];
    exportToCSV(headers, rows, 'サマリー_全体');
  };

  const allReports = [
    { title: '日別', labelHeader: '日付', sheetName: '日別', data: dailyData.map(d => ({ label: `${d.date} ${d.dayOfWeek}`, impressions: d.impressions, clicks: d.clicks, ctr: d.ctr, cpc: d.cpc, spend: d.spend, conversions: d.conversions, cvr: d.cvr, cpa: d.cpa })) },
    { title: '月別', labelHeader: '年月', sheetName: '月別', data: mockMonthlyData },
    { title: '曜日別', labelHeader: '曜日', sheetName: '曜日別', data: mockWeekdayData },
    { title: '時間帯別', labelHeader: '時間', sheetName: '時間帯別', data: mockHourlyData },
    { title: 'キャンペーン別', labelHeader: 'キャンペーン', sheetName: 'キャンペーン別', data: mockCampaignData },
    { title: 'デバイス別', labelHeader: 'デバイス', sheetName: 'デバイス別', data: mockDeviceData },
    { title: '性別', labelHeader: '性別', sheetName: '性別', data: mockGenderData },
    { title: '年齢別', labelHeader: '年齢', sheetName: '年齢別', data: mockAgeData },
  ];

  const handleBulkExcel = () => {
    exportAllReportsToExcel(allReports, '広告レポート_一括');
  };

  const handleBulkPptx = () => {
    exportAllToPptx(
      allReports.map(r => ({ title: r.title, labelHeader: r.labelHeader, data: r.data })),
      '広告レポート_一括'
    );
  };

  return (
    <div>
      <PageHeader
        title="広告レポート - サマリー_全体"
        startDate={startDate}
        endDate={endDate}
        onDateChange={onChange}
        isDemo={isDemo}
        loading={dailyLoading}
      />

      <div className="overflow-x-auto mb-8">
        <div className="flex gap-6" style={{ minWidth: '1200px' }}>
          <div className="flex-1 min-w-[380px] space-y-3">
            <h3 className="text-sm font-semibold text-muted">クリック数 & クリック率</h3>
            <p className="text-[10px] text-muted -mt-2">クリック数 | クリック率 | 表示回数</p>
            <div className="grid grid-cols-3 gap-2">
              {kpis.map((kpi, i) => (
                <KPICard key={i} data={kpi} invertColor={false} />
              ))}
            </div>
            <DualAxisChart
              data={chartData} xKey="date"
              leftKey="クリック数" rightKey="クリック率"
              leftLabel="クリック数" rightLabel="クリック率"
              height={250}
            />
          </div>
          <div className="flex-1 min-w-[380px] space-y-3">
            <h3 className="text-sm font-semibold text-muted">獲得件数 & 獲得率</h3>
            <p className="text-[10px] text-muted -mt-2">獲得件数 | 獲得率 | 獲得単価</p>
            <div className="grid grid-cols-3 gap-2">
              {conversionKPIs.map((kpi, i) => (
                <KPICard key={i} data={kpi} invertColor={i === 2} />
              ))}
            </div>
            <DualAxisChart
              data={chartData} xKey="date"
              leftKey="獲得件数" rightKey="獲得率"
              leftLabel="獲得件数" rightLabel="獲得率"
              height={250}
            />
          </div>
          <div className="flex-1 min-w-[380px] space-y-3">
            <h3 className="text-sm font-semibold text-muted">ご利用金額 & クリック単価</h3>
            <p className="text-[10px] text-muted -mt-2">ご利用金額 | クリック単価 | 表示単価</p>
            <div className="grid grid-cols-3 gap-2">
              {costKPIs.map((kpi, i) => (
                <KPICard key={i} data={kpi} invertColor={true} />
              ))}
            </div>
            <DualAxisChart
              data={chartData} xKey="date"
              leftKey="ご利用金額" rightKey="クリック単価"
              leftLabel="ご利用金額" rightLabel="クリック単価"
              height={250}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted">アカウント別サマリー</h3>
        <ExportButton onCSV={handleExport} onExcel={handleBulkExcel} onPptx={handleBulkPptx} />
      </div>
      <div className="bg-card-bg rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary text-white">
              <th className="text-left px-4 py-2.5 font-medium">アカウント名</th>
              <th className="text-right px-4 py-2.5 font-medium">表示回数</th>
              <th className="text-right px-4 py-2.5 font-medium">クリック数</th>
              <th className="text-right px-4 py-2.5 font-medium">クリック率</th>
              <th className="text-right px-4 py-2.5 font-medium">クリック単価</th>
              <th className="text-right px-4 py-2.5 font-medium">ご利用金額</th>
              <th className="text-right px-4 py-2.5 font-medium">獲得件数</th>
              <th className="text-right px-4 py-2.5 font-medium">獲得率</th>
              <th className="text-right px-4 py-2.5 font-medium">獲得単価</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="px-4 py-3 font-medium flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">f</span>
                {accountSummary.accountName}
              </td>
              <td className="px-4 py-3 text-right">{accountSummary.impressions.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{accountSummary.clicks.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{formatPercent(accountSummary.ctr)}</td>
              <td className="px-4 py-3 text-right">{formatCurrencyExact(accountSummary.cpc)}</td>
              <td className="px-4 py-3 text-right">{formatCurrencyExact(accountSummary.spend)}</td>
              <td className="px-4 py-3 text-right">{accountSummary.conversions.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{formatPercent(accountSummary.cvr)}</td>
              <td className="px-4 py-3 text-right">{formatCurrencyExact(accountSummary.cpa)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold">
              <td className="px-4 py-3">総計</td>
              <td className="px-4 py-3 text-right">{accountSummary.impressions.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{accountSummary.clicks.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{formatPercent(accountSummary.ctr)}</td>
              <td className="px-4 py-3 text-right">{formatCurrencyExact(accountSummary.cpc)}</td>
              <td className="px-4 py-3 text-right">{formatCurrencyExact(accountSummary.spend)}</td>
              <td className="px-4 py-3 text-right">{accountSummary.conversions.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{formatPercent(accountSummary.cvr)}</td>
              <td className="px-4 py-3 text-right">{formatCurrencyExact(accountSummary.cpa)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
