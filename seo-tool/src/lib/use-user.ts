'use client'

import { useEffect, useState } from 'react'

export type CurrentUser = {
  userId: string
  name: string
  picture: string | null
}

export function useUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/seo/api/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        if (data?.authenticated) {
          setUser({ userId: data.userId, name: data.name, picture: data.picture })
        }
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { user, loading }
}
