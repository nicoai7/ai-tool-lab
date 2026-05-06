// CSV/Excel エクスポートユーティリティ

import * as XLSX from 'xlsx';
import { calcMetrics, sumTotals } from './metrics';

interface BreakdownRow {
  label: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  conversions: number;
  cvr: number;
  cpa: number;
}

const EXCEL_HEADERS = [
  '表示回数', 'クリック数', 'クリック率(%)', 'クリック単価(¥)',
  'ご利用金額(¥)', '獲得件数', '獲得率(%)', '獲得単価(¥)',
];
const EXCEL_COL_WIDTHS = [
  { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
  { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
];

// --- CSV ---

export function exportToCSV(
  headers: string[],
  rows: (string | number)[][],
  filename: string,
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
      }).join(','),
    ),
  ].join('\n');

  const BOM = '﻿';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportBreakdownToCSV(
  data: BreakdownRow[],
  labelHeader: string,
  filename: string,
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

// --- Excel ---

function buildSheetData(data: BreakdownRow[], labelHeader: string): (string | number)[][] {
  const headers = [labelHeader, ...EXCEL_HEADERS];
  const rows: (string | number)[][] = data.map(d => [
    d.label, d.impressions, d.clicks, d.ctr, d.cpc, d.spend, d.conversions, d.cvr,
    d.cpa > 0 ? Math.round(d.cpa) : 0,
  ]);

  const totals = sumTotals(data);
  rows.push([
    '総計',
    totals.impressions,
    totals.clicks,
    calcMetrics.ctr(totals.clicks, totals.impressions),
    calcMetrics.cpc(totals.spend, totals.clicks),
    totals.spend,
    totals.conversions,
    calcMetrics.cvr(totals.conversions, totals.clicks),
    calcMetrics.cpa(totals.spend, totals.conversions),
  ]);

  return [headers, ...rows];
}

export function exportBreakdownToExcel(
  data: BreakdownRow[],
  labelHeader: string,
  filename: string,
  sheetName?: string,
) {
  const ws = XLSX.utils.aoa_to_sheet(buildSheetData(data, labelHeader));
  ws['!cols'] = EXCEL_COL_WIDTHS;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'レポート');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportAllReportsToExcel(
  reports: Array<{ sheetName: string; labelHeader: string; data: BreakdownRow[] }>,
  filename: string,
) {
  const wb = XLSX.utils.book_new();
  for (const report of reports) {
    const ws = XLSX.utils.aoa_to_sheet(buildSheetData(report.data, report.labelHeader));
    ws['!cols'] = EXCEL_COL_WIDTHS;
    XLSX.utils.book_append_sheet(wb, ws, report.sheetName);
  }
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
