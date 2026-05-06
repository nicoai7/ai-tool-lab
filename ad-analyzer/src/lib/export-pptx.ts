// PowerPointエクスポート（pptxgenjs）

import PptxGenJS from 'pptxgenjs';
import { BreakdownData, DailyData } from '@/types/meta';

const PRIMARY_COLOR = '4361EE';
const HEADER_COLOR = 'FFFFFF';
const BG_COLOR = 'F8F9FA';

function addTitleSlide(pptx: PptxGenJS, title: string, subtitle: string) {
  const slide = pptx.addSlide();
  slide.background = { color: PRIMARY_COLOR };
  slide.addText(title, { x: 0.5, y: 1.5, w: 9, h: 1.2, fontSize: 32, color: HEADER_COLOR, bold: true });
  slide.addText(subtitle, { x: 0.5, y: 2.8, w: 9, h: 0.6, fontSize: 14, color: 'CCCCFF' });
  slide.addText('Ad Analyzer', { x: 0.5, y: 4.5, w: 9, h: 0.4, fontSize: 10, color: '8888CC' });
}

function addTableSlide(
  pptx: PptxGenJS,
  title: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const slide = pptx.addSlide();
  slide.addText(title, { x: 0.3, y: 0.2, w: 9.4, h: 0.5, fontSize: 16, bold: true, color: '333333' });

  const tableRows: PptxGenJS.TableRow[] = [
    headers.map(h => ({ text: h, options: { bold: true, color: HEADER_COLOR, fill: { color: PRIMARY_COLOR }, fontSize: 8, align: 'center' as const } })),
    ...rows.map(row =>
      row.map(cell => ({ text: String(cell), options: { fontSize: 7, align: 'right' as const, border: { type: 'solid' as const, pt: 0.5, color: 'DDDDDD' } } }))
    ),
  ];

  slide.addTable(tableRows, {
    x: 0.3, y: 0.8, w: 9.4,
    rowH: 0.25,
    colW: Array(headers.length).fill(9.4 / headers.length),
    border: { type: 'solid', pt: 0.5, color: 'DDDDDD' },
  });
}

function addChartSlide(
  pptx: PptxGenJS,
  title: string,
  labels: string[],
  series1: { name: string; values: number[] },
  series2: { name: string; values: number[] },
) {
  const slide = pptx.addSlide();
  slide.addText(title, { x: 0.3, y: 0.2, w: 9.4, h: 0.5, fontSize: 16, bold: true, color: '333333' });

  // 左チャート: series1（棒グラフ）
  slide.addChart(pptx.ChartType.bar, [
    { name: series1.name, labels, values: series1.values },
  ], {
    x: 0.3, y: 0.8, w: 4.5, h: 4.2,
    showLegend: true,
    legendPos: 'b',
    barDir: 'col',
    catAxisLabelFontSize: 7,
    valAxisLabelFontSize: 7,
    chartColors: ['4361EE'],
    showValue: false,
  });

  // 右チャート: series2（折れ線グラフ）
  slide.addChart(pptx.ChartType.line, [
    { name: series2.name, labels, values: series2.values },
  ], {
    x: 5.2, y: 0.8, w: 4.5, h: 4.2,
    showLegend: true,
    legendPos: 'b',
    lineDataSymbol: 'circle',
    lineDataSymbolSize: 5,
    catAxisLabelFontSize: 7,
    valAxisLabelFontSize: 7,
    chartColors: ['EF4444'],
  });
}

function breakdownToTableRows(data: BreakdownData[]) {
  return data.map(d => [
    d.label, d.impressions.toLocaleString(), d.clicks.toLocaleString(),
    `${d.ctr.toFixed(1)}%`, `¥${d.cpc}`, `¥${d.spend.toLocaleString()}`,
    d.conversions.toLocaleString(), `${d.cvr.toFixed(1)}%`,
    d.cpa > 0 ? `¥${Math.round(d.cpa).toLocaleString()}` : '-',
  ]);
}

const TABLE_HEADERS = ['ラベル', '表示回数', 'クリック数', 'CTR', 'CPC', '費用', '獲得数', 'CVR', 'CPA'];

// 単一レポートのPowerPoint出力
export function exportBreakdownToPptx(
  data: BreakdownData[],
  title: string,
  labelHeader: string,
  filename: string,
) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  addTitleSlide(pptx, title, `期間: レポート出力日 ${new Date().toLocaleDateString('ja-JP')}`);

  const headers = [labelHeader, ...TABLE_HEADERS.slice(1)];
  addTableSlide(pptx, `${title} - データ`, headers, breakdownToTableRows(data));

  const labels = data.map(d => d.label);
  addChartSlide(pptx, '表示回数 & クリック率',
    labels,
    { name: '表示回数', values: data.map(d => d.impressions) },
    { name: 'クリック率(%)', values: data.map(d => d.ctr) },
  );
  addChartSlide(pptx, '獲得件数 & 獲得単価',
    labels,
    { name: '獲得件数', values: data.map(d => d.conversions) },
    { name: '獲得単価(¥)', values: data.map(d => d.cpa) },
  );

  pptx.writeFile({ fileName: `${filename}.pptx` });
}

// 全レポートまとめてPowerPoint出力
export function exportAllToPptx(
  reports: Array<{
    title: string;
    labelHeader: string;
    data: BreakdownData[];
  }>,
  filename: string,
) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  addTitleSlide(pptx, '広告配信レポート', `出力日: ${new Date().toLocaleDateString('ja-JP')}`);

  for (const report of reports) {
    const headers = [report.labelHeader, ...TABLE_HEADERS.slice(1)];
    addTableSlide(pptx, report.title, headers, breakdownToTableRows(report.data));

    const labels = report.data.map(d => d.label);
    addChartSlide(pptx, `${report.title} - 表示回数 & クリック率`,
      labels,
      { name: '表示回数', values: report.data.map(d => d.impressions) },
      { name: 'クリック率(%)', values: report.data.map(d => d.ctr) },
    );
    addChartSlide(pptx, `${report.title} - 獲得件数 & 獲得単価`,
      labels,
      { name: '獲得件数', values: report.data.map(d => d.conversions) },
      { name: '獲得単価(¥)', values: report.data.map(d => d.cpa) },
    );
  }

  pptx.writeFile({ fileName: `${filename}.pptx` });
}
