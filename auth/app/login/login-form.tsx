'use client'

import { useSearchParams } from 'next/navigation'

const ERROR_MESSAGES: Record<string, string> = {
  missing_params: 'ログイン情報が不完全です。もう一度お試しください。',
  state_mismatch: 'セキュリティエラーが発生しました。もう一度お試しください。',
  callback_failed: 'ログイン処理に失敗しました。時間を置いて再度お試しください。',
  access_denied: 'ログインがキャンセルされました。',
}

export default function LoginForm() {
  const searchParams = useSearchParams()
  const errorKey = searchParams.get('error')
  const redirect = searchParams.get('redirect') || ''
  const errorMessage = errorKey ? ERROR_MESSAGES[errorKey] ?? 'ログインエラーが発生しました。' : null

  const loginUrl = redirect
    ? `/api/auth/line?redirect=${encodeURIComponent(redirect)}`
    : '/api/auth/line'

  return (
    <div
      className="relative z-10 w-full max-w-md rounded-2xl p-8"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e2d1',
        boxShadow:
          '0 2px 10px -2px rgba(14,26,59,0.06), 0 30px 60px -28px rgba(14,26,59,0.18)',
      }}
    >
      {/* Top gold hairline with diamond */}
      <div className="relative -mt-[1px] mb-7">
        <div className="absolute left-10 right-10 top-0 h-px" style={{ backgroundColor: '#e8e2d1' }} />
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-[3px] w-1.5 h-1.5 rotate-45"
          style={{ backgroundColor: '#b89758' }}
        />
      </div>

      <div className="flex items-center gap-3 mb-7">
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
        <div className="leading-tight">
          <div className="text-[14px] font-semibold tracking-wide" style={{ color: '#0e1a3b' }}>
            AIツールラボ
          </div>
          <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: '#b89758' }}>
            AI Tool Lab
          </div>
        </div>
      </div>

      <h1
        className="text-[26px] font-bold mb-2 tracking-tight"
        style={{ color: '#0e1a3b', letterSpacing: '0.01em' }}
      >
        ようこそ
      </h1>
      <p className="text-[13.5px] leading-relaxed mb-6" style={{ color: '#4a5168' }}>
        LINEでログインしてツールをご利用ください。
      </p>

      {errorMessage && (
        <div
          className="mb-5 p-3 rounded-xl text-[13px]"
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.06)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            color: '#9b1c1c',
          }}
        >
          {errorMessage}
        </div>
      )}

      <a
        href={loginUrl}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
        style={{
          backgroundColor: '#06C755',
          boxShadow: '0 10px 26px -10px rgba(6,199,85,0.55)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 10.5C24 5 18.6.5 12 .5S0 5 0 10.5c0 4.9 4.3 9 10.1 9.8.4.1.9.3 1.1.6.2.3.1.7.1 1l-.2 1c-.1.3-.2 1.3 1.1.7 1.3-.6 7.1-4.2 9.7-7.2C23.3 14.4 24 12.5 24 10.5zM8.3 13.5H5.9c-.3 0-.6-.3-.6-.6V8.1c0-.3.3-.6.6-.6s.6.3.6.6v4.2h1.8c.3 0 .6.3.6.6s-.3.6-.6.6zm2.3-.6c0 .3-.3.6-.6.6s-.6-.3-.6-.6V8.1c0-.3.3-.6.6-.6s.6.3.6.6v4.8zm5.7 0c0 .3-.2.5-.4.6h-.2c-.2 0-.4-.1-.5-.2l-2.5-3.3v3c0 .3-.3.6-.6.6s-.6-.3-.6-.6V8.1c0-.3.2-.5.4-.6h.2c.2 0 .4.1.5.2l2.5 3.4V8.1c0-.3.3-.6.6-.6s.6.3.6.6v4.8zm3.8-3c.3 0 .6.3.6.6s-.3.6-.6.6h-1.7v1.2h1.7c.3 0 .6.3.6.6s-.3.6-.6.6h-2.3c-.3 0-.6-.3-.6-.6V8.1c0-.3.3-.6.6-.6h2.3c.3 0 .6.3.6.6s-.3.6-.6.6h-1.7v1.2h1.7z" />
        </svg>
        LINEでログイン
      </a>

      <p className="text-[11.5px] text-center mt-6 leading-relaxed" style={{ color: '#8a8fa0' }}>
        ログインには公式LINE「AIツールラボ」への友だち登録が必要です。
        <br />
        未登録の方は、ログイン後に登録画面へご案内します。
      </p>
    </div>
  )
}
