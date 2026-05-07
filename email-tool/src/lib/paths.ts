// basePath を一箇所に集約。next.config.ts の basePath と同じ値。
// クライアント側 fetch URL や Server Action 内 redirect に利用する。
export const BASE_PATH = "/email";

export function withBasePath(path: string): string {
  if (!path.startsWith("/")) return `${BASE_PATH}/${path}`;
  return `${BASE_PATH}${path}`;
}
