import Link from 'next/link'
import { Suspense } from 'react'
import { getAddFriendUrl, getBasicId } from '@/lib/line/friendship'

export default function NotFriendPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>
}) {
  const addUrl = getAddFriendUrl()
  const basicId = getBasicId()
  const qrUrl = `https://qr-official.line.me/sid/M/${basicId.replace('@', '')}.png`

  return (
    <main
      className="relative min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden"
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
            <pattern id="net-nf" width="72" height="72" patternUnits="userSpaceOnUse">
              <path d="M0 36 H72 M36 0 V72 M0 0 L72 72 M72 0 L0 72" stroke="#0e1a3b" strokeWidth="0.4" opacity="0.05" />
              <circle cx="36" cy="36" r="1.3" fill="#0e1a3b" opacity="0.22" />
              <circle cx="0" cy="0" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="72" cy="0" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="0" cy="72" r="0.9" fill="#b89758" opacity="0.35" />
              <circle cx="72" cy="72" r="0.9" fill="#b89758" opacity="0.35" />
            </pattern>
            <linearGradient id="net-nf-mask" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.5" />
              <stop offset="60%" stopColor="white" stopOpacity="0.2" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#net-nf)" />
          <rect width="100%" height="100%" fill="url(#net-nf-mask)" style={{ mixBlendMode: 'lighten' }} />
        </svg>
      </div>

      <div
        className="relative z-10 w-full max-w-xl rounded-2xl p-8 sm:p-10 text-center"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e8e2d1',
          boxShadow:
            '0 2px 10px -2px rgba(14,26,59,0.06), 0 30px 60px -28px rgba(14,26,59,0.18)',
        }}
      >
        {/* Top gold hairline with diamond */}
        <div className="relative -mt-[1px] mb-6">
          <div className="absolute left-10 right-10 top-0 h-px" style={{ backgroundColor: '#e8e2d1' }} />
          <div
            className="absolute left-1/2 -translate-x-1/2 -top-[3px] w-1.5 h-1.5 rotate-45"
            style={{ backgroundColor: '#b89758' }}
          />
        </div>

        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11.5px] mb-6"
          style={{
            backgroundColor: '#faf8f1',
            border: '1px solid #e8e2d1',
            color: '#4a5168',
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#b89758' }} />
          あと1ステップでご利用可能です
        </div>

        <h1
          className="text-3xl sm:text-[34px] font-bold tracking-tight mb-4 leading-tight"
          style={{ color: '#0e1a3b', letterSpacing: '0.01em' }}
        >
          <Suspense fallback={null}>
            <Greeting searchParams={searchParams} />
          </Suspense>
          公式LINEへの
          <br />
          友だち登録をお願いします
        </h1>

        <p className="leading-relaxed mb-8 text-[14px] sm:text-[15px]" style={{ color: '#4a5168' }}>
          AIツールラボは、公式LINEに登録された方限定でご利用いただけます。
          <br className="hidden sm:block" />
          下のボタンから友だち追加後、リッチメニューから再度アクセスしてください。
        </p>

        <div className="flex flex-col items-center gap-6 mb-8">
          <a
            href={addUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
            style={{
              backgroundColor: '#06C755',
              boxShadow: '0 10px 26px -10px rgba(6,199,85,0.55)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M24 10.5C24 5 18.6.5 12 .5S0 5 0 10.5c0 4.9 4.3 9 10.1 9.8.4.1.9.3 1.1.6.2.3.1.7.1 1l-.2 1c-.1.3-.2 1.3 1.1.7 1.3-.6 7.1-4.2 9.7-7.2C23.3 14.4 24 12.5 24 10.5z" />
            </svg>
            公式LINEに友だち追加する
          </a>

          <div
            className="inline-block rounded-2xl p-5"
            style={{ backgroundColor: '#faf8f1', border: '1px solid #e8e2d1' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="公式LINE QRコード"
              width={160}
              height={160}
              className="rounded-lg"
            />
            <p className="text-[12px] mt-3" style={{ color: '#8a8fa0' }}>
              QRコードでも追加できます
            </p>
            <p className="text-[11px] mt-1 font-mono" style={{ color: '#4a5168' }}>
              {basicId}
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-4 text-left mb-6"
          style={{ backgroundColor: '#faf8f1', border: '1px solid #e8e2d1' }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2"
            style={{ color: '#b89758' }}
          >
            ご利用の流れ
          </p>
          <ol className="text-[13.5px] space-y-1.5 list-decimal list-inside" style={{ color: '#4a5168' }}>
            <li>上のボタン or QRから公式LINEを友だち追加</li>
            <li>届いたLINEメッセージのリッチメニューを開く</li>
            <li>各ツールへのリンクからアクセス</li>
          </ol>
        </div>

        <Link
          href="/login"
          className="text-[13px] transition underline underline-offset-4"
          style={{ color: '#4a5168' }}
        >
          友だち登録済みの方はこちらから再ログイン
        </Link>
      </div>
    </main>
  )
}

async function Greeting({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>
}) {
  const params = await searchParams
  const name = params?.name
  if (!name) return null
  return <>{name}さん、</>
}
