// 日付ユーティリティ
// toISOString() はUTC基準のため、JST 0-9時台で日付が前日にズレる。
// このヘルパーは常にローカルタイムで YYYY-MM-DD を生成する。

export function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateLocal(yyyymmdd: string): Date {
  return new Date(`${yyyymmdd}T00:00:00`);
}

export function getDayOfWeekLocal(yyyymmdd: string): number {
  return parseDateLocal(yyyymmdd).getDay();
}
