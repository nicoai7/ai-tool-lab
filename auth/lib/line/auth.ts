import { SignJWT, jwtVerify, createRemoteJWKSet, jwtVerify as joseJwtVerify } from 'jose'

const LINE_AUTHORIZE_URL = 'https://access.line.me/oauth2/v2.1/authorize'
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token'
const LINE_PROFILE_URL = 'https://api.line.me/v2/profile'
const LINE_JWKS_URL = 'https://api.line.me/oauth2/v2.1/certs'
const LINE_ISSUER = 'https://access.line.me'
const STATE_TTL = 60 * 5 // 5分（短縮）
const ISSUER = 'ai-tool-lab/auth'
const STATE_AUDIENCE = 'line-state'

export const PKCE_COOKIE = '__Host-ai_tool_lab_pkce'
export const PKCE_COOKIE_DEV = 'ai_tool_lab_pkce'

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
  const secret = process.env.STATE_SECRET || process.env.SESSION_SECRET
  if (!secret) throw new Error('STATE_SECRET (or SESSION_SECRET fallback) is not set')
  return new TextEncoder().encode(secret)
}

// 内部リダイレクト先かを検証する。`/` 始まりでも `//` や `/\` は外部URLに解釈されるため弾く。
export function isSafeInternalPath(p: string | undefined | null): p is string {
  if (!p) return false
  if (p.length > 512) return false
  if (!p.startsWith('/')) return false
  if (p.startsWith('//') || p.startsWith('/\\')) return false
  // 認証フローに使う内部APIや認証コールバックへのリダイレクトは無限ループの種なので拒否
  if (p.startsWith('/api/') || p.startsWith('/auth/')) return false
  return true
}

// stateをJWTで署名（cookie不要・stateless）。LINEアプリ内ブラウザでcookie送信が不安定な問題に対応。
// PKCE の code_challenge をペアで持たせる。code_verifier は別途 httpOnly cookie へ。
export async function signState(opts: {
  redirectPath?: string
  codeChallenge: string
}): Promise<string> {
  return await new SignJWT({
    p: isSafeInternalPath(opts.redirectPath) ? opts.redirectPath : '',
    cc: opts.codeChallenge,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(STATE_AUDIENCE)
    .setJti(crypto.randomUUID())
    .setExpirationTime(`${STATE_TTL}s`)
    .sign(getStateSecret())
}

export async function verifyState(state: string): Promise<{
  redirectPath?: string
  codeChallenge: string
} | null> {
  try {
    const { payload } = await jwtVerify(state, getStateSecret(), {
      issuer: ISSUER,
      audience: STATE_AUDIENCE,
    })
    const p = (payload as { p?: string; cc?: string }).p
    const cc = (payload as { p?: string; cc?: string }).cc
    if (typeof cc !== 'string' || cc.length === 0) return null
    return {
      redirectPath: p && p.length > 0 ? p : undefined,
      codeChallenge: cc,
    }
  } catch {
    return null
  }
}

export async function generatePkce(): Promise<{ verifier: string; challenge: string }> {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const verifier = base64url(bytes)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const challenge = base64url(new Uint8Array(digest))
  return { verifier, challenge }
}

function base64url(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function buildAuthorizeUrl(opts: {
  state: string
  codeChallenge: string
  nonce: string
}): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getChannelId(),
    redirect_uri: getRedirectUri(),
    state: opts.state,
    scope: 'profile openid',
    code_challenge: opts.codeChallenge,
    code_challenge_method: 'S256',
    nonce: opts.nonce,
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

export async function exchangeCodeForToken(opts: {
  code: string
  codeVerifier: string
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: opts.code,
    redirect_uri: getRedirectUri(),
    client_id: getChannelId(),
    client_secret: getChannelSecret(),
    code_verifier: opts.codeVerifier,
  })

  const res = await fetch(LINE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store',
  })

  if (!res.ok) {
    // 生レスポンスはログに残さず、ステータスのみ
    throw new Error(`LINE token exchange failed: ${res.status}`)
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
    throw new Error(`LINE profile fetch failed: ${res.status}`)
  }
  return res.json()
}

let lineJwks: ReturnType<typeof createRemoteJWKSet> | undefined
function getLineJwks() {
  if (!lineJwks) {
    lineJwks = createRemoteJWKSet(new URL(LINE_JWKS_URL))
  }
  return lineJwks
}

// id_token を検証し、sub と nonce を返す。aud は LINE channel id、iss は access.line.me。
export async function verifyIdToken(idToken: string): Promise<{
  sub: string
  nonce?: string
} | null> {
  try {
    const { payload } = await joseJwtVerify(idToken, getLineJwks(), {
      issuer: LINE_ISSUER,
      audience: getChannelId(),
    })
    const sub = payload.sub
    if (typeof sub !== 'string' || sub.length === 0) return null
    const nonce = (payload as { nonce?: unknown }).nonce
    return { sub, nonce: typeof nonce === 'string' ? nonce : undefined }
  } catch {
    return null
  }
}

export function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return base64url(bytes)
}
