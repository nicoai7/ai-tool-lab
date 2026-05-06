import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/session'
import { checkFriendship } from '@/lib/line/friendship'

export async function DashboardHero() {
  const session = await requireSession('/dashboard')

  const status = await checkFriendship(session.accessToken, session.sub)
  if (status === 'unauthorized') {
    redirect('/login?error=session_expired&redirect=/dashboard')
  }
  if (status === 'not_friend') {
    redirect(`/not-friend?name=${encodeURIComponent(session.name)}`)
  }
  // status === 'error' はネットワーク不調等のため、最後に判定された状態を信頼して表示を許可。

  const displayName = session.name || 'お客様'

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-5">
        <span className="h-px w-10" style={{ backgroundColor: '#b89758' }} />
        <span className="text-[10.5px] tracking-[0.32em] uppercase font-medium" style={{ color: '#b89758' }}>
          Your Toolkit
        </span>
        <span className="h-px flex-1" style={{ backgroundColor: '#e8e2d1' }} />
      </div>
      <h2
        className="font-bold tracking-tight"
        style={{
          fontSize: 'clamp(28px, 4.2vw, 40px)',
          lineHeight: 1.2,
          color: '#0e1a3b',
          letterSpacing: '0.01em',
        }}
      >
        ようこそ、
        <span style={{ color: '#b89758' }}>{displayName}</span>
        さん
      </h2>
      <p className="mt-4 text-[14px] max-w-xl leading-relaxed" style={{ color: '#4a5168' }}>
        3つのAIツールを無料でご利用いただけます。各ツールカードから、お使いのツールをお選びください。
      </p>
    </section>
  )
}

export function DashboardHeroFallback() {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-5">
        <span className="h-px w-10" style={{ backgroundColor: '#b89758' }} />
        <span className="text-[10.5px] tracking-[0.32em] uppercase font-medium" style={{ color: '#b89758' }}>
          Your Toolkit
        </span>
        <span className="h-px flex-1" style={{ backgroundColor: '#e8e2d1' }} />
      </div>
      <div
        className="animate-pulse rounded"
        style={{ height: 48, width: '60%', backgroundColor: '#ece5d3', maxWidth: 480 }}
      />
      <div
        className="mt-4 animate-pulse rounded"
        style={{ height: 18, width: '80%', backgroundColor: '#ece5d3', maxWidth: 520 }}
      />
    </section>
  )
}
