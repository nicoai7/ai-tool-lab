import { randomBytes } from 'crypto'

const LINE_AUTHORIZE_URL = 'https://access.line.me/oauth2/v2.1/authorize'
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token'
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile'

export function getChannelId(): string {
  const v = process.env.LINE_LOGIN_CHANNEL_ID
  if (!v) throw new Error('LINE_LOGIN_CHANNEL_ID is not set')
  return v
}

export function getChannelSecret(): string {
  const v = process.env.LINE_LOGIN_CHANNEL_SECRET
  if (!v) throw new Error('LINE_LOGIN_CHANNEL_SECRET is not set')
  return v
}

export function getRedirectUri(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'
  // basePath '/seo' 配下に Next.js がルーティングするため、redirect_uri も /seo を含める
  return `${site}/seo/auth/callback/line`
}

export function generateState(): string {
  return randomBytes(16).toString('hex')
}

export function buildAuthorizeUrl(state: string, redirectPath?: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getChannelId(),
    redirect_uri: getRedirectUri(),
    state,
    scope: 'profile openid',
  })
  if (redirectPath) {
    params.set('state', `${state}.${Buffer.from(redirectPath).toString('base64url')}`)
  }
  return `${LINE_AUTHORIZE_URL}?${params.toString()}`
}

export function parseState(state: string): { nonce: string; redirectPath?: string } {
  const [nonce, encodedPath] = state.split('.')
  if (!encodedPath) return { nonce }
  try {
    return { nonce, redirectPath: Buffer.from(encodedPath, 'base64url').toString('utf-8') }
  } catch {
    return { nonce }
  }
}

type TokenResponse = {
  access_token: string
  expires_in: number
  id_token: string
  refresh_token: string
  scope: string
  token_type: string
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(),
    client_id: getChannelId(),
    client_secret: getChannelSecret(),
  })

  const res = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LINE token exchange failed: ${res.status} ${text}`)
  }
  return res.json()
}

type LineProfile = {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

export async function fetchProfile(accessToken: string): Promise<LineProfile> {
  const res = await fetch(LINE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LINE profile fetch failed: ${res.status} ${text}`)
  }
  return res.json()
}
