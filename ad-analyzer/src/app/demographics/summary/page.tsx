'use client';

import PageHeader from '@/components/PageHeader';
import ExportButton from '@/components/ExportButton';
import HeatmapChart from '@/components/HeatmapChart';
import HorizontalBarChart from '@/components/HorizontalBarChart';
import { mockDeviceData, mockGenderData, mockAgeData, mockRegionData, mockHeatmapData } from '@/lib/mock-data';
import { exportAllReportsToExcel } from '@/lib/export';
import { exportAllToPptx } from '@/lib/export-pptx';
import { exportToCSV } from '@/lib/export';

export default function DemographicsSummaryPage() {
  const deviceChart = mockDeviceData.filter(d => d.clicks > 0).map(d => ({ label: d.label, value: d.clicks }));
  const genderChart = mockGenderData.filter(d => d.clicks > 0).map(d => ({ label: d.label, value: d.clicks }));
  const ageChart = mockAgeData.filter(d => d.clicks > 0).map(d => ({ label: d.label, value: d.clicks }));
  const regionChart = mockRegionData.slice(0, 15).map(d => ({ label: d.label, value: d.clicks }));

  const allDemoReports = [
    { title: 'デバイス別', labelHeader: 'デバイス', sheetName: 'デバイス別', data: mockDeviceData },
    { title: '性別', labelHeader: '性別', sheetName: '性別', data: mockGenderData },
    { title: '年齢別', labelHeader: '年齢', sheetName: '年齢別', data: mockAgeData },
    { title: '地域別', labelHeader: '都道府県', sheetName: '地域別', data: mockRegionData },
  ];

  const handleCSV = () => {
    const all = [...mockDeviceData, ...mockGenderData, ...mockAgeData];
    const headers = ['カテゴリ', '表示回数', 'クリック数', 'CTR', 'CPC', '費用', '獲得数', 'CVR', 'CPA'];
    const rows = all.map(d => [d.label, d.impressions, d.clicks, `${d.ctr}%`, `¥${d.cpc}`, `¥${d.spend}`, d.conversions, `${d.cvr}%`, d.cpa > 0 ? `¥${Math.round(d.cpa)}` : '-']);
    exportToCSV(headers, rows, '広告レポート_属性サマリー');
  };

  return (
    <div>
      <PageHeader title="広告レポート - サマリー_属性" />

      <div className="flex justify-end mb-3">
        <ExportButton
          onCSV={handleCSV}
          onExcel={() => exportAllReportsToExcel(allDemoReports, '広告レポート_属性サマリー')}
          onPptx={() => exportAllToPptx(allDemoReports, '広告レポート_属性サマリー')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <HorizontalBarChart data={deviceChart} title="デバイス別クリック数" height={120} />
        <HeatmapChart data={mockHeatmapData} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <HorizontalBarChart data={genderChart} title="性別クリック数" height={140} />
        <HorizontalBarChart data={regionChart} title="地域別クリック数" height={400} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <HorizontalBarChart data={ageChart} title="年齢別クリック数" height={200} />
      </div>
    </div>
  );
}
