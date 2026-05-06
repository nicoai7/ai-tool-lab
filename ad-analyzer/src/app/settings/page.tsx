'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { apiUrl } from '@/lib/api-url';
import { Link2, CheckCircle, RefreshCw } from 'lucide-react';

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  currency: string;
  timezone_name: string;
}

export default function SettingsPage() {
  const { isAuthenticated, isLoading, accountId, accountName, login, logout, selectAccount } = useAuth();
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const router = useRouter();

  async function refreshCache() {
    setRefreshing(true);
    setRefreshMessage(null);
    try {
      const res = await fetch(apiUrl('/api/cache/invalidate'), { method: 'POST' });
      if (!res.ok) throw new Error('Failed to invalidate cache');
      setRefreshMessage('キャッシュを更新しました。次回のアクセスで最新データが取得されます。');
      router.refresh();
    } catch {
      setRefreshMessage('キャッシュの更新に失敗しました。');
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadAccounts();
    }
  }, [isAuthenticated]);

  async function loadAccounts() {
    setLoadingAccounts(true);
    try {
      const res = await fetch(apiUrl('/api/auth/accounts'));
      const data = await res.json();
      if (data.accounts) setAccounts(data.accounts);
    } catch (e) {
      console.error('Failed to load accounts:', e);
    } finally {
      setLoadingAccounts(false);
    }
  }

  return (
    <div>
      <PageHeader title="設定" />

      {/* 接続状態 */}
      <div className="bg-card-bg rounded-xl border border-border p-6 mb-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Link2 size={18} />
          Meta広告アカウント接続
        </h3>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <RefreshCw size={14} className="animate-spin" />
            接続状態を確認中...
          </div>
        ) : isAuthenticated ? (
          <div>
            <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">接続済み</span>
              {accountName && (
                <span className="text-sm text-green-700">- {accountName}</span>
              )}
            </div>

            {/* アカウント選択 */}
            {accounts.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">広告アカウントを選択</p>
                <div className="space-y-2">
                  {accounts.map(acc => (
                    <button
                      key={acc.account_id}
                      onClick={() => selectAccount(acc.account_id, acc.name)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors text-sm ${
                        accountId === acc.account_id
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-border hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{acc.name}</span>
                          <span className="text-muted ml-2">({acc.account_id})</span>
                        </div>
                        <span className="text-xs text-muted">{acc.currency} / {acc.timezone_name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loadingAccounts && (
              <div className="flex items-center gap-2 text-sm text-muted mb-4">
                <RefreshCw size={14} className="animate-spin" />
                アカウント一覧を取得中...
              </div>
            )}

            <button
              onClick={logout}
              className="px-4 py-2 border border-danger text-danger rounded-lg text-sm hover:bg-red-50 transition-colors"
            >
              接続を解除
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted mb-4">
              Meta広告アカウントを接続すると、あなたの広告データが自動的に取得・分析されます。
            </p>
            <button
              onClick={login}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <span className="w-5 h-5 bg-white rounded flex items-center justify-center text-blue-600 text-xs font-bold">f</span>
              Metaアカウントでログイン
            </button>
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-800">
                現在デモデータを表示しています。実際の広告データを分析するにはMetaアカウントを接続してください。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* キャッシュ管理 */}
      {isAuthenticated && (
        <div className="bg-card-bg rounded-xl border border-border p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <RefreshCw size={18} />
            データキャッシュ
          </h3>
          <p className="text-xs text-muted mb-4">
            広告データは10分間キャッシュされます。Meta上で広告を変更した直後など、最新の数値を即座に反映したい場合は更新してください。
          </p>
          <button
            onClick={refreshCache}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? '更新中...' : 'キャッシュを更新'}
          </button>
          {refreshMessage && (
            <p className="text-xs text-muted mt-3" role="status">{refreshMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}
