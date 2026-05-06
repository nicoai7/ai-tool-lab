// API URL 構築の一元化
// next.config.ts の basePath と一致させる必要がある。
// クライアントから fetch する際、Next.js Link は basePath を自動付与するが
// fetch() は付与されないため、このヘルパーを経由する。

const BASE_PATH = '/ad-analyzer';

export function apiUrl(path: string): string {
  const cleaned = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${cleaned}`;
}
