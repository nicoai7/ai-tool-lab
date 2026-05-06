import Link from 'next/link'

export default function Home() {
  return (
    <main
      className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden"
      style={{ backgroundColor: '#faf8f1', color: '#0e1a3b' }}
    >
      {/* Ambient paper + network pattern */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 70% at 50% 0%, rgba(184,151,88,0.08), transparent 60%), radial-gradient(ellipse 80% 60% at 100% 100%, rgba(14,26,59,0.05), transparent 60%)',
          }}
        />
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="net-home" width="72" height="72" patternUnits="userSpaceOnUse">
              <path d="M0 36 H72 M36 0 V72 M0 0 L72 72 M72 0 L0 72" stroke="#0e1a3b" strokeWidth="0.4" opacity="0.05" />
              <circle cx="36" cy="36" r="1.3" fill="#0e1a3b" opacity="0.22" />
              <circle cx="0" cy="0" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="72" cy="0" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="0" cy="72" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="72" cy="72" r="0.9" fill="#b89758" opacity="0.35" />
            </pattern>
            <linearGradient id="net-home-mask" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.45" />
              <stop offset="60%" stopColor="white" stopOpacity="0.2" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#net-home)" />
          <rect width="100%" height="100%" fill="url(#net-home-mask)" style={{ mixBlendMode: 'lighten' }} />
        </svg>
      </div>

      <div className="max-w-2xl text-center relative z-10">
        {/* Top gold line accent */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="h-px w-10" style={{ backgroundColor: '#b89758' }} />
          <span className="text-[10.5px] tracking-[0.32em] uppercase font-medium" style={{ color: '#b89758' }}>
            AI Tool Lab
          </span>
          <span className="h-px w-10" style={{ backgroundColor: '#b89758' }} />
        </div>

        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11.5px] mb-8"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e2d1',
            color: '#4a5168',
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#b89758' }} />
          公式LINE登録者限定・無料
        </div>

        <h1
          className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 leading-[1.05]"
          style={{ color: '#0e1a3b', letterSpacing: '-0.01em' }}
        >
          AIツールラボ
        </h1>

        <p className="leading-relaxed mb-6 text-[15px] sm:text-base" style={{ color: '#4a5168' }}>
          業務効率化のためのAIツールを、公式LINE登録者に無料で提供しています。
        </p>

        <div
          className="inline-block text-left rounded-2xl px-6 py-5 mb-10"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e2d1',
            boxShadow: '0 2px 10px -2px rgba(14,26,59,0.05)',
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-3" style={{ color: '#b89758' }}>
            現在ご利用いただけるツール
          </p>
          <ul className="space-y-2 text-[14px]" style={{ color: '#0e1a3b' }}>
            <li className="flex items-start gap-2.5">
              <span
                className="mt-[7px] shrink-0 w-1.5 h-1.5 rotate-45"
                style={{ backgroundColor: '#b89758' }}
              />
              <span>Meta広告分析改善ツール</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span
                className="mt-[7px] shrink-0 w-1.5 h-1.5 rotate-45"
                style={{ backgroundColor: '#b89758' }}
              />
              <span>SEO分析改善・記事作成ツール</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span
                className="mt-[7px] shrink-0 w-1.5 h-1.5 rotate-45"
                style={{ backgroundColor: '#b89758' }}
              />
              <span>Gmail簡単管理ツール</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="group relative px-8 py-3.5 rounded-xl font-semibold text-[14px] overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #0e1a3b 0%, #1e2a52 100%)',
              color: '#faf8f1',
              boxShadow:
                '0 10px 30px -10px rgba(14,26,59,0.55), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(184,151,88,0.22)',
            }}
          >
            <span className="relative z-10 inline-flex items-center gap-1.5">
              LINEでログイン
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
            <span
              aria-hidden
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg, #1e2a52 0%, #2c3a66 100%)' }}
            />
          </Link>
        </div>

        <p className="text-[12px] mt-8" style={{ color: '#8a8fa0' }}>
          公式LINE「AIツールラボ」への友だち登録が必要です。
        </p>
      </div>
    </main>
  )
}
