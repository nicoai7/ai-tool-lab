import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/session'
import { checkFriendship, getBasicId } from '@/lib/line/friendship'

export async function AccountContent() {
  const session = await requireSession('/account')

  const status = await checkFriendship(session.accessToken, session.sub)
  if (status === 'unauthorized') {
    redirect('/login?error=session_expired&redirect=/account')
  }
  if (status === 'not_friend') {
    redirect(`/not-friend?name=${encodeURIComponent(session.name)}`)
  }

  return (
    <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
      <SectionCard eyebrow="LINE Account" title="LINEアカウント情報">
        <div className="flex items-center gap-4">
          {session.picture && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.picture}
              alt={session.name}
              width={56}
              height={56}
              className="rounded-full"
              style={{ border: '1px solid #e8e2d1' }}
            />
          )}
          <div>
            <div className="font-medium" style={{ color: '#0e1a3b' }}>
              {session.name}
            </div>
            <div className="text-[12px] mt-0.5 font-mono break-all" style={{ color: '#8a8fa0' }}>
              {session.sub}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard eyebrow="Membership" title="会員状態">
        <div className="flex items-center gap-2 text-[14px]">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: '#b89758', boxShadow: '0 0 8px rgba(184,151,88,0.4)' }}
          />
          <span style={{ color: '#0e1a3b', fontWeight: 500 }}>
            公式LINE「AIツールラボ」の友だち登録済み
          </span>
        </div>
        <p className="text-[13px] mt-3 leading-relaxed" style={{ color: '#4a5168' }}>
          公式LINE（<span className="font-mono">{getBasicId()}</span>
          ）の友だち登録者限定で、ラボの各AIツールを無料でご利用いただけます。
          友だち登録を解除するとアクセスできなくなります。
        </p>
      </SectionCard>

      <SectionCard eyebrow="Tools" title="利用可能なツール" last>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium transition"
          style={{ color: '#0e1a3b' }}
        >
          <span style={{ borderBottom: '1px solid #b89758' }}>ダッシュボードで確認</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b89758" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </SectionCard>
    </div>
  )
}

export function AccountContentFallback() {
  return (
    <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
      <div
        className="rounded-2xl p-6 mb-5 animate-pulse"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e8e2d1',
          minHeight: 120,
        }}
      />
      <div
        className="rounded-2xl p-6 mb-5 animate-pulse"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e8e2d1',
          minHeight: 100,
        }}
      />
      <div
        className="rounded-2xl p-6 animate-pulse"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e8e2d1',
          minHeight: 60,
        }}
      />
    </div>
  )
}

function SectionCard({
  eyebrow,
  title,
  last,
  children,
}: {
  eyebrow: string
  title: string
  last?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      className={`relative rounded-2xl p-6 ${last ? '' : 'mb-5'}`}
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e2d1',
        boxShadow: '0 2px 10px -2px rgba(14,26,59,0.05), 0 20px 40px -28px rgba(14,26,59,0.1)',
      }}
    >
      {/* Top gold hairline with diamond */}
      <div className="relative -mt-[1px] mb-5">
        <div className="absolute left-4 right-4 top-0 h-px" style={{ backgroundColor: '#e8e2d1' }} />
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-[3px] w-1.5 h-1.5 rotate-45"
          style={{ backgroundColor: '#b89758' }}
        />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1.5" style={{ color: '#b89758' }}>
        {eyebrow}
      </p>
      <h2 className="font-semibold mb-4" style={{ color: '#0e1a3b' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}
