// 数値フォーマットユーティリティ

export function formatNumber(value: number): string {
  if (value >= 10000) {
    return (value / 10000).toFixed(1) + '万';
  }
  return value.toLocaleString('ja-JP');
}

export function formatCurrency(value: number): string {
  if (value >= 10000) {
    return '¥' + (value / 10000).toFixed(1) + '万';
  }
  return '¥' + value.toLocaleString('ja-JP');
}

export function formatCurrencyExact(value: number): string {
  return '¥' + value.toLocaleString('ja-JP');
}

export function formatCurrencyDecimal(value: number): string {
  return '¥' + value.toLocaleString('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function formatPercent(value: number): string {
  return value.toFixed(1) + '%';
}

export function formatChangePercent(value: number | undefined): { text: string; isPositive: boolean } {
  if (value === undefined || value === null) return { text: '-', isPositive: true };
  const isPositive = value >= 0;
  const arrow = isPositive ? '↑' : '↓';
  return {
    text: `${arrow} ${Math.abs(value).toFixed(1)}%`,
    isPositive,
  };
}

export function formatKPIValue(value: number, format: string): string {
  switch (format) {
    case 'number':
      return formatNumber(value);
    case 'percent':
      return formatPercent(value);
    case 'currency':
      return formatCurrency(value);
    case 'currency_decimal':
      return formatCurrencyDecimal(value);
    default:
      return value.toString();
  }
}
