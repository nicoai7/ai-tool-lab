'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { Download, FileSpreadsheet, FileText, Presentation } from 'lucide-react';
import { exportAllReportsToExcel, exportBreakdownToCSV } from '@/lib/export';
import { exportAllToPptx } from '@/lib/export-pptx';
import {
  mockDailyData, mockMonthlyData, mockWeekdayData, mockHourlyData,
  mockDeviceData, mockGenderData, mockAgeData, mockRegionData,
  mockCampaignData, mockAdGroupData, mockAdCreatives,
} from '@/lib/mock-data';

interface ReportOption {
  id: string;
  label: string;
  category: string;
  labelHeader: string;
  data: any[];
}

const reportOptions: ReportOption[] = [
  { id: 'daily', label: '日別', category: '期間別', labelHeader: '日付', data: mockDailyData.map(d => ({ label: `${d.date} ${d.dayOfWeek}`, impressions: d.impressions, clicks: d.clicks, ctr: d.ctr, cpc: d.cpc, spend: d.spend, conversions: d.conversions, cvr: d.cvr, cpa: d.cpa })) },
  { id: 'monthly', label: '月別', category: '期間別', labelHeader: '年月', data: mockMonthlyData },
  { id: 'weekday', label: '曜日別', category: '期間別', labelHeader: '曜日', data: mockWeekdayData },
  { id: 'hourly', label: '時間帯別', category: '期間別', labelHeader: '時間', data: mockHourlyData },
  { id: 'campaign', label: 'キャンペーン別', category: '階層別', labelHeader: 'キャンペーン', data: mockCampaignData },
  { id: 'adgroup', label: '広告グループ別', category: '階層別', labelHeader: '広告グループ', data: mockAdGroupData },
  { id: 'ad', label: '広告別', category: '階層別', labelHeader: '広告', data: mockAdCreatives },
  { id: 'device', label: 'デバイス', category: '属性別', labelHeader: 'デバイス', data: mockDeviceData },
  { id: 'gender', label: '性別', category: '属性別', labelHeader: '性別', data: mockGenderData },
  { id: 'age', label: '年齢', category: '属性別', labelHeader: '年齢', data: mockAgeData },
  { id: 'region', label: '地域', category: '属性別', labelHeader: '都道府県', data: mockRegionData },
];

const categories = ['期間別', '階層別', '属性別'];

export default function ExportPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set(reportOptions.map(r => r.id)));

  const toggleItem = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    const ids = reportOptions.filter(r => r.category === category).map(r => r.id);
    const allSelected = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(reportOptions.map(r => r.id)));
  const selectNone = () => setSelected(new Set());

  const selectedReports = reportOptions.filter(r => selected.has(r.id));

  const handleExcel = () => {
    if (selectedReports.length === 0) return;
    exportAllReportsToExcel(
      selectedReports.map(r => ({ sheetName: r.label, labelHeader: r.labelHeader, data: r.data })),
      '広告レポート_一括'
    );
  };

  const handlePptx = () => {
    if (selectedReports.length === 0) return;
    exportAllToPptx(
      selectedReports.map(r => ({ title: r.label, labelHeader: r.labelHeader, data: r.data })),
      '広告レポート_一括'
    );
  };

  const handleCSV = () => {
    if (selectedReports.length === 0) return;
    selectedReports.forEach(r => {
      exportBreakdownToCSV(r.data, r.labelHeader, `広告レポート_${r.label}`);
    });
  };

  return (
    <div>
      <PageHeader title="一括出力" subtitle="複数のレポートを選択して、まとめてダウンロードできます" />

      {/* 出力ボタン */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleCSV}
          disabled={selected.size === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileText size={16} />
          CSV出力（個別ファイル）
        </button>
        <button
          onClick={handleExcel}
          disabled={selected.size === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet size={16} />
          Excel一括出力
        </button>
        <button
          onClick={handlePptx}
          disabled={selected.size === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Presentation size={16} />
          PowerPoint一括出力
        </button>
        <span className="text-xs text-muted ml-2">{selected.size}件選択中</span>
      </div>

      {/* レポート選択 */}
      <div className="bg-card-bg rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">出力するレポートを選択</h3>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs text-primary hover:underline">すべて選択</button>
            <span className="text-xs text-muted">|</span>
            <button onClick={selectNone} className="text-xs text-primary hover:underline">すべて解除</button>
          </div>
        </div>

        <div className="space-y-5">
          {categories.map(category => {
            const items = reportOptions.filter(r => r.category === category);
            const allSelected = items.every(r => selected.has(r.id));
            const someSelected = items.some(r => selected.has(r.id));

            return (
              <div key={category}>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={() => toggleCategory(category)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                  />
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">{category}</span>
                </label>
                <div className="grid grid-cols-4 gap-2 ml-6">
                  {items.map(item => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        selected.has(item.id)
                          ? 'bg-primary/5 border-primary/30 text-primary'
                          : 'bg-white border-border text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary/20"
                      />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 出力プレビュー */}
      <div className="mt-6 bg-gray-50 rounded-xl border border-border p-5">
        <h4 className="text-xs font-semibold text-muted mb-3">出力内容プレビュー</h4>
        {selected.size === 0 ? (
          <p className="text-sm text-muted">レポートを選択してください</p>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-muted mb-2">以下の{selected.size}件のレポートが出力されます：</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedReports.map(r => (
                <span key={r.id} className="px-2 py-1 text-xs bg-white border border-border rounded-full">
                  {r.label}
                </span>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border text-xs text-muted space-y-1">
              <p>Excel: 1ファイルに{selected.size}シートで出力</p>
              <p>PowerPoint: 1ファイルにテーブル+チャートスライドで出力</p>
              <p>CSV: {selected.size}個の個別CSVファイルで出力</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
