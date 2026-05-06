const LINE_FRIENDSHIP_URL = 'https://api.line.me/friendship/v1/status'

export async function checkFriendship(accessToken: string): Promise<boolean> {
  const res = await fetch(LINE_FRIENDSHIP_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    // 401 (トークン期限切れ等) は未登録扱いで再ログインさせる
    return false
  }
  const data = (await res.json()) as { friendFlag?: boolean }
  return data.friendFlag === true
}

export function getAddFriendUrl(): string {
  const basicId = process.env.NEXT_PUBLIC_LINE_OA_BASIC_ID || '@972lxiol'
  const id = basicId.startsWith('@') ? basicId.slice(1) : basicId
  return `https://line.me/R/ti/p/%40${id}`
}

export function getBasicId(): string {
  return process.env.NEXT_PUBLIC_LINE_OA_BASIC_ID || '@972lxiol'
}
