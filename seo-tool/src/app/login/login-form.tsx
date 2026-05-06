'use client'

import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

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
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg mb-4">
          <Search className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">SEOツール</h1>
        <p className="text-sm text-gray-500">公式LINE登録者限定・無料</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">ようこそ</h2>
        <p className="text-sm text-gray-500 mb-6">
          LINEでログインしてツールをご利用ください。
        </p>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <a
          href={loginUrl}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white
                     bg-[#06C755] hover:bg-[#05b74c]
                     shadow-[0_10px_26px_-10px_rgba(6,199,85,0.55)]
                     hover:shadow-[0_10px_40px_-6px_rgba(6,199,85,0.8)]
                     transition-all duration-300 hover:-translate-y-0.5"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M24 10.5C24 5 18.6.5 12 .5S0 5 0 10.5c0 4.9 4.3 9 10.1 9.8.4.1.9.3 1.1.6.2.3.1.7.1 1l-.2 1c-.1.3-.2 1.3 1.1.7 1.3-.6 7.1-4.2 9.7-7.2C23.3 14.4 24 12.5 24 10.5zM8.3 13.5H5.9c-.3 0-.6-.3-.6-.6V8.1c0-.3.3-.6.6-.6s.6.3.6.6v4.2h1.8c.3 0 .6.3.6.6s-.3.6-.6.6zm2.3-.6c0 .3-.3.6-.6.6s-.6-.3-.6-.6V8.1c0-.3.3-.6.6-.6s.6.3.6.6v4.8zm5.7 0c0 .3-.2.5-.4.6h-.2c-.2 0-.4-.1-.5-.2l-2.5-3.3v3c0 .3-.3.6-.6.6s-.6-.3-.6-.6V8.1c0-.3.2-.5.4-.6h.2c.2 0 .4.1.5.2l2.5 3.4V8.1c0-.3.3-.6.6-.6s.6.3.6.6v4.8zm3.8-3c.3 0 .6.3.6.6s-.3.6-.6.6h-1.7v1.2h1.7c.3 0 .6.3.6.6s-.3.6-.6.6h-2.3c-.3 0-.6-.3-.6-.6V8.1c0-.3.3-.6.6-.6h2.3c.3 0 .6.3.6.6s-.3.6-.6.6h-1.7v1.2h1.7z" />
          </svg>
          LINEでログイン
        </a>

        <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
          ログインには公式LINE「AIツールラボ」への<br />
          友だち登録が必要です。
        </p>
      </div>
    </div>
  )
}
