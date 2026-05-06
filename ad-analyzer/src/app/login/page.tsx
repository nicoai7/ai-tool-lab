'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background -ml-60">
      <div className="w-full max-w-md">
        <div className="bg-card-bg rounded-2xl border border-border p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">📊 Ad Analyzer</h1>
            <p className="text-sm text-muted">Meta広告のパフォーマンスを自動分析</p>
          </div>

          {isAuthenticated ? (
            <div className="text-center">
              <p className="text-sm text-success font-medium mb-4">接続済みです</p>
              <Link
                href="/"
                className="block w-full text-center px-5 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                ダッシュボードへ
              </Link>
            </div>
          ) : (
            <>
              <button
                onClick={login}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium mb-4"
              >
                <span className="w-6 h-6 bg-white rounded flex items-center justify-center text-blue-600 text-sm font-bold">f</span>
                Metaアカウントでログイン
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card-bg px-3 text-muted">または</span>
                </div>
              </div>

              <Link
                href="/"
                className="block w-full text-center px-5 py-3 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                デモデータで試す
              </Link>
            </>
          )}

          <p className="text-xs text-muted text-center mt-6">
            ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます。
          </p>
        </div>
      </div>
    </div>
  );
}
