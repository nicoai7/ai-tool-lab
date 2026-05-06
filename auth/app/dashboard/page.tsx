import Link from 'next/link'
import { Suspense } from 'react'
import { DashboardHero, DashboardHeroFallback } from './dashboard-content'

type Tool = {
  name: string
  tagline: string
  description: string
  solves: string
  url: string
  manualPath: string
  /** soft pastel gradient for the card top strip */
  accent: string
  /** ink color for tool-specific labels / divider dots */
  ink: string
  badge: string
  icon: 'meta' | 'seo' | 'mail'
}

const TOOLS: Tool[] = [
  {
    name: 'Meta広告分析改善ツール',
    tagline: 'KPI可視化 × AI改善提案',
    description: 'Meta広告のKPIを自動で可視化し、AIが改善提案と競合分析まで一気通貫で実施します。',
    solves: '「広告を回しているが、どこを改善すれば良いか分からない」という運用担当者の悩みを解決します。',
    url: '/ad-analyzer/ai-advice',
    manualPath: '/manuals/Meta広告分析改善ツール_使い方マニュアル.pdf',
    accent: 'linear-gradient(135deg, #dfe6f2 0%, #c9d3e5 60%, #b7c4dc 100%)',
    ink: '#3a4872',
    badge: 'Meta広告',
    icon: 'meta',
  },
  {
    name: 'SEO分析改善・記事作成ツール',
    tagline: '記事生成 × 検索順位改善',
    description: 'キーワードからSEO記事を自動生成。既存記事のスコア分析・リライト・サイト総合診断も実施可能。',
    solves: '「SEO記事を書く時間がない」「既存記事の検索順位が上がらない」という課題を解決します。',
    url: '/seo',
    manualPath: '/manuals/SEO分析改善・記事作成ツール_使い方マニュアル.pdf',
    accent: 'linear-gradient(135deg, #ece0ee 0%, #dfd0e3 60%, #cbb9d4 100%)',
    ink: '#6b4a78',
    badge: 'SEO',
    icon: 'seo',
  },
  {
    name: 'Gmail簡単管理ツール',
    tagline: '要約 × 優先度自動分類',
    description: 'AIがGmailの受信メールを自動で要約・優先度分類。複数アカウントを1画面で一括管理できます。',
    solves: '「毎朝大量のメールをチェックするのが大変」「重要なメールを見落としがち」という課題を解決します。',
    url: '/email',
    manualPath: '/manuals/Gmail簡単管理ツール_使い方マニュアル.pdf',
    accent: 'linear-gradient(135deg, #e1ece0 0%, #cfdfd0 60%, #b9cebb 100%)',
    ink: '#4e6b52',
    badge: 'メール管理',
    icon: 'mail',
  },
]

export default function DashboardPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: '#faf8f1', color: '#0e1a3b' }}
    >
      {/* Ambient paper + network pattern */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {/* warm paper wash */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 70% at 50% 0%, rgba(184,151,88,0.06), transparent 60%), radial-gradient(ellipse 80% 60% at 100% 100%, rgba(14,26,59,0.04), transparent 60%)',
          }}
        />
        {/* subtle network pattern — dots & connecting lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="net" width="72" height="72" patternUnits="userSpaceOnUse">
              {/* thin connecting lines */}
              <path d="M0 36 H72 M36 0 V72 M0 0 L72 72 M72 0 L0 72" stroke="#0e1a3b" strokeWidth="0.4" opacity="0.05" />
              {/* node dots */}
              <circle cx="36" cy="36" r="1.3" fill="#0e1a3b" opacity="0.22" />
              <circle cx="0" cy="0" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="72" cy="0" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="0" cy="72" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="72" cy="72" r="0.9" fill="#b89758" opacity="0.35" />
            </pattern>
            <linearGradient id="netMask" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.55" />
              <stop offset="60%" stopColor="white" stopOpacity="0.2" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#net)" />
          <rect width="100%" height="100%" fill="url(#netMask)" style={{ mixBlendMode: 'lighten' }} />
        </svg>
        <div
          className="absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0) 0, rgba(255,255,255,0) 2px, rgba(14,26,59,0.008) 2px, rgba(14,26,59,0.008) 4px)',
          }}
        />
      </div>

      {/* Header */}
      <header
        className="relative z-20 border-b"
        style={{ backgroundColor: 'rgba(250,248,241,0.75)', borderColor: '#e8e2d1', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monogram />
            <div className="leading-tight">
              <div className="text-[14px] font-semibold tracking-wide" style={{ color: '#0e1a3b' }}>
                AIツールラボ
              </div>
              <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: '#b89758' }}>
                AI Tool Lab
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium"
              style={{ border: '1px solid #e8e2d1', backgroundColor: '#ffffff', color: '#0e1a3b' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#b89758' }} />
              認証済み
            </div>
            <Link
              href="/account"
              aria-label="設定"
              title="設定"
              className="p-2.5 rounded-xl transition"
              style={{ border: '1px solid #e8e2d1', backgroundColor: '#ffffff', color: '#0e1a3b' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-14 pb-20">
        {/* Hero — 認証＋friendship判定の動的部分。Suspenseで分離してシェルを先に流す */}
        <Suspense fallback={<DashboardHeroFallback />}>
          <DashboardHero />
        </Suspense>

        {/* Tools grid — 完全静的なのでキャッシュ可能 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.name} tool={tool} />
          ))}
        </div>

        {/* Footer */}
        <div
          className="mt-16 pt-6 text-[11px] flex flex-wrap items-center justify-between gap-3"
          style={{ borderTop: '1px solid #e8e2d1', color: '#8a8fa0' }}
        >
          <div className="flex items-center gap-2">
            <span>©</span>
            <span>AIツールラボ</span>
            <span style={{ color: '#d4b87a' }}>◆</span>
            <span>AI Tool Lab</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/account" className="transition hover:text-[#0e1a3b]">アカウント</Link>
            <span style={{ color: '#d4b87a' }}>·</span>
            <span>公式LINE登録者限定</span>
          </div>
        </div>
      </div>
    </main>
  )
}

function Monogram() {
  return (
    <div className="relative h-9 w-9">
      <div
        className="absolute inset-0 rounded-[10px]"
        style={{
          background: 'linear-gradient(135deg, #0e1a3b 0%, #1e2a52 100%)',
          boxShadow: '0 4px 14px -4px rgba(14,26,59,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      />
      <div
        className="absolute inset-[1px] rounded-[9px] flex items-center justify-center"
        style={{ border: '1px solid rgba(184,151,88,0.5)' }}
      >
        <span
          className="text-[13px] font-bold tracking-wider"
          style={{
            background: 'linear-gradient(135deg, #d4b87a 0%, #b89758 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          AI
        </span>
      </div>
    </div>
  )
}

function ToolIcon({ name, color }: { name: Tool['icon']; color: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (name === 'meta') {
    return (
      <svg {...common}>
        <path d="M3 3v18h18" />
        <path d="M7 14l3-3 3 3 5-6" />
      </svg>
    )
  }
  if (name === 'seo') {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  )
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <div
      className="group relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e2d1',
        boxShadow: '0 2px 10px -2px rgba(14,26,59,0.06), 0 20px 40px -24px rgba(14,26,59,0.12)',
      }}
    >
      {/* Top pastel strip with icon */}
      <div
        className="relative h-28 overflow-hidden"
        style={{ background: tool.accent }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.45), transparent 60%)' }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
          <line x1="0" y1="60%" x2="100%" y2="30%" stroke={tool.ink} strokeWidth="0.4" />
          <line x1="0" y1="80%" x2="100%" y2="55%" stroke={tool.ink} strokeWidth="0.3" />
          <circle cx="20%" cy="45%" r="1.6" fill={tool.ink} />
          <circle cx="55%" cy="35%" r="1.2" fill={tool.ink} />
          <circle cx="82%" cy="55%" r="1.4" fill={tool.ink} />
        </svg>
        <div className="relative h-full flex flex-col justify-between p-5">
          <div className="flex items-start justify-between">
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(255,255,255,0.85)',
                border: `1px solid ${tool.ink}33`,
                boxShadow: '0 4px 14px -4px rgba(14,26,59,0.18)',
              }}
            >
              <ToolIcon name={tool.icon} color={tool.ink} />
            </div>
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wide"
              style={{
                color: tool.ink,
                backgroundColor: 'rgba(255,255,255,0.85)',
                border: `1px solid ${tool.ink}33`,
              }}
            >
              {tool.badge}
            </span>
          </div>
          <div className="text-[11px] font-medium tracking-wide" style={{ color: tool.ink }}>
            {tool.tagline}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-6 right-6 top-0 h-px" style={{ backgroundColor: '#e8e2d1' }} />
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-[3px] w-1.5 h-1.5 rotate-45"
          style={{ backgroundColor: '#b89758' }}
        />
      </div>

      <div className="relative p-6 pt-7 flex-1 flex flex-col">
        <h3
          className="mb-4 tracking-tight leading-snug font-bold"
          style={{
            color: '#0e1a3b',
            fontSize: '17px',
            letterSpacing: '0.01em',
          }}
        >
          {tool.name}
        </h3>

        <div className="mb-4">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1.5"
            style={{ color: '#b89758' }}
          >
            できること
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: '#4a5168' }}>
            {tool.description}
          </p>
        </div>

        <div className="mb-6 flex-1">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1.5"
            style={{ color: '#b89758' }}
          >
            解決できる課題
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: '#4a5168' }}>
            {tool.solves}
          </p>
        </div>

        <div className="space-y-2.5">
          <a
            href={tool.url}
            className="relative block text-center py-3 rounded-xl font-semibold text-[13px] overflow-hidden transition-all duration-300 group/btn"
            style={{
              background: 'linear-gradient(135deg, #0e1a3b 0%, #1e2a52 100%)',
              color: '#faf8f1',
              boxShadow: '0 6px 18px -6px rgba(14,26,59,0.55), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(184,151,88,0.22)',
            }}
          >
            <span className="relative z-10 inline-flex items-center gap-1.5">
              ツールを開く
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
            <span
              aria-hidden
              className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(135deg, #1e2a52 0%, #2c3a66 100%)',
              }}
            />
          </a>
          <a
            href={tool.manualPath}
            target="_blank"
            rel="noreferrer"
            download
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-medium text-[12.5px] transition hover:bg-[#faf8f1]"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e8e2d1',
              color: '#0e1a3b',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            使い方マニュアル
          </a>
        </div>
      </div>
    </div>
  )
}
