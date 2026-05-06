import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getBasicId } from '@/lib/line/friendship'

export default async function AccountPage() {
  const session = await getSession()
  if (!session) redirect('/login?redirect=/account')

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: '#faf8f1', color: '#0e1a3b' }}
    >
      {/* Ambient paper + network pattern */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 70% at 50% 0%, rgba(184,151,88,0.06), transparent 60%), radial-gradient(ellipse 80% 60% at 100% 100%, rgba(14,26,59,0.04), transparent 60%)',
          }}
        />
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="net-acct" width="72" height="72" patternUnits="userSpaceOnUse">
              <path d="M0 36 H72 M36 0 V72 M0 0 L72 72 M72 0 L0 72" stroke="#0e1a3b" strokeWidth="0.4" opacity="0.05" />
              <circle cx="36" cy="36" r="1.3" fill="#0e1a3b" opacity="0.22" />
              <circle cx="0" cy="0" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="72" cy="0" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="0" cy="72" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="72" cy="72" r="0.9" fill="#b89758" opacity="0.35" />
            </pattern>
            <linearGradient id="net-acct-mask" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.55" />
              <stop offset="60%" stopColor="white" stopOpacity="0.2" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#net-acct)" />
          <rect width="100%" height="100%" fill="url(#net-acct-mask)" style={{ mixBlendMode: 'lighten' }} />
        </svg>
      </div>

      {/* Header */}
      <header
        className="relative z-20 sticky top-0 border-b"
        style={{
          backgroundColor: 'rgba(250,248,241,0.75)',
          borderColor: '#e8e2d1',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              aria-label="戻る"
              className="p-2 rounded-lg transition"
              style={{
                border: '1px solid #e8e2d1',
                backgroundColor: '#ffffff',
                color: '#0e1a3b',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold tracking-wide" style={{ color: '#0e1a3b' }}>
                アカウント
              </div>
              <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: '#b89758' }}>
                Account
              </div>
            </div>
          </div>
          <form action="/api/logout" method="post">
            <button
              className="px-3 py-1.5 rounded-lg text-[12px] transition"
              style={{
                border: '1px solid #e8e2d1',
                backgroundColor: '#ffffff',
                color: '#4a5168',
              }}
            >
              ログアウト
            </button>
          </form>
        </div>
      </header>

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
    </main>
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
