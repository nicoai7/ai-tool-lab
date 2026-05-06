import { SignJWT, jwtVerify } from 'jose'

const LINE_AUTHORIZE_URL = 'https://access.line.me/oauth2/v2.1/authorize'
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token'
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile'
const STATE_TTL = 60 * 10 // 10分

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
  return `${site}/auth/callback/line`
}

function getStateSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

// stateをJWTで署名（cookie不要・stateless）。LINEアプリ内ブラウザでcookie送信が不安定な問題に対応。
export async function signState(redirectPath?: string): Promise<string> {
  return await new SignJWT({ p: redirectPath ?? '' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${STATE_TTL}s`)
    .sign(getStateSecret())
}

export async function verifyState(state: string): Promise<{ redirectPath?: string } | null> {
  try {
    const { payload } = await jwtVerify(state, getStateSecret())
    const p = (payload as { p?: string }).p
    return { redirectPath: p && p.length > 0 ? p : undefined }
  } catch {
    return null
  }
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getChannelId(),
    redirect_uri: getRedirectUri(),
    state,
    scope: 'profile openid',
  })
  return `${LINE_AUTHORIZE_URL}?${params.toString()}`
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
