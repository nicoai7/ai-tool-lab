// 環境変数バリデーション。
// サーバーモジュールが起動時に呼び出すことで、環境変数欠落を早期検出する。

interface RequiredEnv {
  META_APP_ID: string;
  META_APP_SECRET: string;
  NEXT_PUBLIC_META_APP_ID: string;
  NEXT_PUBLIC_APP_URL: string;
  ANTHROPIC_API_KEY: string;
  SESSION_SECRET: string;
}

let cached: RequiredEnv | null = null;

export function getServerEnv(): RequiredEnv {
  if (cached) return cached;

  const required: (keyof RequiredEnv)[] = [
    'META_APP_ID',
    'META_APP_SECRET',
    'NEXT_PUBLIC_META_APP_ID',
    'NEXT_PUBLIC_APP_URL',
    'ANTHROPIC_API_KEY',
    'SESSION_SECRET',
  ];

  const missing: string[] = [];
  const env = {} as RequiredEnv;
  for (const key of required) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
    } else {
      env[key] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // NEXT_PUBLIC_APP_URL は URL として有効か
  try {
    new URL(env.NEXT_PUBLIC_APP_URL);
  } catch {
    throw new Error(`NEXT_PUBLIC_APP_URL is not a valid URL: ${env.NEXT_PUBLIC_APP_URL}`);
  }

  cached = env;
  return env;
}
