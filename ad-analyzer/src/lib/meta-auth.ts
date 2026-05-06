// Meta OAuth 2.0 認証ヘルパー

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0';

export function getMetaLoginUrl(): string {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/ad-analyzer/api/auth/meta/callback`;
  const scope = [
    'ads_read',
    'ads_management',
    'business_management',
  ].join(',');

  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/ad-analyzer/api/auth/meta/callback`,
    code,
  });

  const res = await fetch(`${META_GRAPH_URL}/oauth/access_token?${params}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Token exchange failed: ${JSON.stringify(error)}`);
  }
  return res.json();
}

export async function getLongLivedToken(shortToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortToken,
  });

  const res = await fetch(`${META_GRAPH_URL}/oauth/access_token?${params}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Long-lived token exchange failed: ${JSON.stringify(error)}`);
  }
  return res.json();
}

export async function getAdAccounts(accessToken: string): Promise<Array<{
  id: string;
  name: string;
  account_id: string;
  currency: string;
  timezone_name: string;
}>> {
  const res = await fetch(
    `${META_GRAPH_URL}/me/adaccounts?fields=id,name,account_id,currency,timezone_name&access_token=${accessToken}`
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to fetch ad accounts: ${JSON.stringify(error)}`);
  }
  const data = await res.json();
  return data.data;
}
