// CSV/Excel/PowerPointエクスポートユーティリティ

import * as XLSX from 'xlsx';

// --- CSV ---

export function exportToCSV(
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(val => {
        const s = String(val);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      }).join(',')
    ),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportBreakdownToCSV(
  data: Array<{ label: string; impressions: number; clicks: number; ctr: number; cpc: number; spend: number; conversions: number; cvr: number; cpa: number }>,
  labelHeader: string,
  filename: string
) {
  const headers = [labelHeader, '表示回数', 'クリック数', 'クリック率', 'クリック単価', 'ご利用金額', '獲得件数', '獲得率', '獲得単価'];
  const rows = data.map(d => [
    d.label,
    d.impressions,
    d.clicks,
    `${d.ctr.toFixed(2)}%`,
    `¥${d.cpc}`,
    `¥${d.spend}`,
    d.conversions,
    `${d.cvr.toFixed(2)}%`,
    d.cpa > 0 ? `¥${Math.round(d.cpa)}` : '-',
  ]);
  exportToCSV(headers, rows, filename);
}

// --- Excel (.xlsx) ---

export function exportBreakdownToExcel(
  data: Array<{ label: string; impressions: number; clicks: number; ctr: number; cpc: number; spend: number; conversions: number; cvr: number; cpa: number }>,
  labelHeader: string,
  filename: string,
  sheetName?: string
) {
  const headers = [labelHeader, '表示回数', 'クリック数', 'クリック率(%)', 'クリック単価(¥)', 'ご利用金額(¥)', '獲得件数', '獲得率(%)', '獲得単価(¥)'];
  const rows = data.map(d => [
    d.label,
    d.impressions,
    d.clicks,
    d.ctr,
    d.cpc,
    d.spend,
    d.conversions,
    d.cvr,
    d.cpa > 0 ? Math.round(d.cpa) : 0,
  ]);

  const wsData = [headers, ...rows];

  // 総計行
  const totals = data.reduce((acc, d) => ({
    impressions: acc.impressions + d.impressions,
    clicks: acc.clicks + d.clicks,
    spend: acc.spend + d.spend,
    conversions: acc.conversions + d.conversions,
  }), { impressions: 0, clicks: 0, spend: 0, conversions: 0 });
  const totalCtr = totals.impressions > 0 ? Math.round((totals.clicks / totals.impressions) * 10000) / 100 : 0;
  const totalCpc = totals.clicks > 0 ? Math.round(totals.spend / totals.clicks) : 0;
  const totalCvr = totals.clicks > 0 ? Math.round((totals.conversions / totals.clicks) * 10000) / 100 : 0;
  const totalCpa = totals.conversions > 0 ? Math.round(totals.spend / totals.conversions) : 0;

  wsData.push(['総計', totals.impressions, totals.clicks, totalCtr, totalCpc, totals.spend, totals.conversions, totalCvr, totalCpa]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // 列幅設定
  ws['!cols'] = [
    { wch: 20 }, // label
    { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
    { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'レポート');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// 全レポートを1つのExcelファイルにまとめて出力
export function exportAllReportsToExcel(
  reports: Array<{
    sheetName: string;
    labelHeader: string;
    data: Array<{ label: string; impressions: number; clicks: number; ctr: number; cpc: number; spend: number; conversions: number; cvr: number; cpa: number }>;
  }>,
  filename: string
) {
  const wb = XLSX.utils.book_new();

  reports.forEach(report => {
    const headers = [report.labelHeader, '表示回数', 'クリック数', 'クリック率(%)', 'クリック単価(¥)', 'ご利用金額(¥)', '獲得件数', '獲得率(%)', '獲得単価(¥)'];
    const rows = report.data.map(d => [
      d.label, d.impressions, d.clicks, d.ctr, d.cpc, d.spend, d.conversions, d.cvr, d.cpa > 0 ? Math.round(d.cpa) : 0,
    ]);
    const wsData = [headers, ...rows];

    const totals = report.data.reduce((acc, d) => ({
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
      spend: acc.spend + d.spend,
      conversions: acc.conversions + d.conversions,
    }), { impressions: 0, clicks: 0, spend: 0, conversions: 0 });
    const totalCtr = totals.impressions > 0 ? Math.round((totals.clicks / totals.impressions) * 10000) / 100 : 0;
    const totalCpc = totals.clicks > 0 ? Math.round(totals.spend / totals.clicks) : 0;
    const totalCvr = totals.clicks > 0 ? Math.round((totals.conversions / totals.clicks) * 10000) / 100 : 0;
    const totalCpa = totals.conversions > 0 ? Math.round(totals.spend / totals.conversions) : 0;
    wsData.push(['総計', totals.impressions, totals.clicks, totalCtr, totalCpc, totals.spend, totals.conversions, totalCvr, totalCpa]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, report.sheetName);
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// --- ヘルパー ---

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
