import { cacheLife, cacheTag } from 'next/cache'

const LINE_FRIENDSHIP_URL = 'https://api.line.me/friendship/v1/status'

export type FriendshipStatus = 'friend' | 'not_friend' | 'unauthorized' | 'error'

// LINE Messaging API は秒単位の即時性を要求しないので 2 分キャッシュ。
// userId 単位でタグ付けし、ログアウトや友だち削除イベントで invalidate 可能。
// accessToken と userId はキャッシュキーに含まれる（Cache Components がクロージャ変数を捕捉）。
export async function checkFriendship(
  accessToken: string,
  userId: string,
): Promise<FriendshipStatus> {
  'use cache'
  cacheLife({ stale: 60, revalidate: 120, expire: 300 })
  cacheTag(`friendship:${userId}`)

  const res = await fetch(LINE_FRIENDSHIP_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (res.status === 401 || res.status === 403) {
    return 'unauthorized'
  }
  if (!res.ok) {
    return 'error'
  }
  const data = (await res.json()) as { friendFlag?: boolean }
  return data.friendFlag === true ? 'friend' : 'not_friend'
}

export function getAddFriendUrl(): string {
  const basicId = process.env.NEXT_PUBLIC_LINE_OA_BASIC_ID || '@972lxiol'
  const id = basicId.startsWith('@') ? basicId.slice(1) : basicId
  return `https://line.me/R/ti/p/%40${id}`
}

export function getBasicId(): string {
  return process.env.NEXT_PUBLIC_LINE_OA_BASIC_ID || '@972lxiol'
}
