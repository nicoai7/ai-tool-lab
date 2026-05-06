import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { EncryptJWT, jwtDecrypt } from 'jose'
import { isSafeInternalPath } from '@/lib/line/auth'

// 本番は __Host- プレフィックスでホスト限定を強制（Domain属性なし・path=/・Secure必須）。
// 開発は http なので Secure を強制できない。secure 属性なし cookie に __Host- を付けるとブラウザが拒否するため、
// 環境で cookie 名を分岐する。
const isProd = process.env.NODE_ENV === 'production'
export const SESSION_COOKIE = isProd ? '__Host-ai_tool_lab_session' : 'ai_tool_lab_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30日
const ISSUER = 'ai-tool-lab/auth'
const SESSION_AUDIENCE = 'session'

export type LineSession = {
  sub: string
  name: string
  picture?: string
  accessToken: string
}

// JWE A256GCM は 32byte (256bit) の鍵が必要。SESSION_SECRET の SHA-256 を取って 32byte に正規化する。
let cachedKey: Uint8Array | undefined
async function getEncryptionKey(): Promise<Uint8Array> {
  if (cachedKey) return cachedKey
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  cachedKey = new Uint8Array(digest)
  return cachedKey
}

export async function signSession(payload: LineSession): Promise<string> {
  const key = await getEncryptionKey()
  return await new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .encrypt(key)
}

function isLineSessionPayload(p: unknown): p is LineSession {
  if (!p || typeof p !== 'object') return false
  const o = p as Record<string, unknown>
  return (
    typeof o.sub === 'string' &&
    o.sub.length > 0 &&
    typeof o.name === 'string' &&
    typeof o.accessToken === 'string' &&
    o.accessToken.length > 0 &&
    (o.picture === undefined || typeof o.picture === 'string')
  )
}

export async function verifySessionToken(token: string): Promise<LineSession | null> {
  try {
    const key = await getEncryptionKey()
    const { payload } = await jwtDecrypt(token, key, {
      issuer: ISSUER,
      audience: SESSION_AUDIENCE,
    })
    if (!isLineSessionPayload(payload)) return null
    return {
      sub: payload.sub,
      name: payload.name,
      picture: payload.picture,
      accessToken: payload.accessToken,
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<LineSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

// 認証必須ページ向けの共通ヘルパ。未ログインなら /login?redirect=... に飛ばす。
export async function requireSession(redirectFrom: string): Promise<LineSession> {
  const session = await getSession()
  if (!session) {
    const safe = isSafeInternalPath(redirectFrom) ? redirectFrom : '/dashboard'
    redirect(`/login?redirect=${encodeURIComponent(safe)}`)
  }
  return session
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
