'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/use-user'
import { Trash2, Search, RefreshCw, ExternalLink, Check } from 'lucide-react'

type TabKey = 'all' | 'create' | 'improve' | 'audit'

export default function HistoryPage() {
  const supabase = createClient()
  const { user } = useUser()
  const [tab, setTab] = useState<TabKey>('all')
  const [articles, setArticles] = useState<any[]>([])
  const [audits, setAudits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    if (!user) return
    setLoading(true)

    const [articlesRes, auditsRes] = await Promise.all([
      supabase.from('articles').select('*').eq('user_id', user.userId).order('created_at', { ascending: false }),
      supabase.from('audits').select('*').eq('user_id', user.userId).order('created_at', { ascending: false }),
    ])

    setArticles(articlesRes.data || [])
    setAudits(auditsRes.data || [])
    setSelected(new Set())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [user])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === allItems.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allItems.map(item => `${item._type}:${item.id}`)))
    }
  }

  const deleteSelected = async () => {
    if (selected.size === 0) return
    if (!confirm(`${selected.size}件の履歴を削除しますか？`)) return
    setDeleting(true)

    const articleIds: string[] = []
    const auditIds: string[] = []

    selected.forEach(key => {
      const [type, id] = key.split(':')
      if (type === 'article') articleIds.push(id)
      else if (type === 'audit') auditIds.push(id)
    })

    if (articleIds.length > 0) {
      await supabase.from('articles').delete().in('id', articleIds)
      setArticles(prev => prev.filter(a => !articleIds.includes(a.id)))
    }
    if (auditIds.length > 0) {
      await supabase.from('audits').delete().in('id', auditIds)
      setAudits(prev => prev.filter(a => !auditIds.includes(a.id)))
    }

    setSelected(new Set())
    setDeleting(false)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const filteredArticles = tab === 'all' ? articles : tab === 'audit' ? [] : articles.filter(a => a.mode === tab)
  const filteredAudits = tab === 'all' ? audits : tab === 'audit' ? audits : []

  const allItems = [
    ...filteredArticles.map(a => ({ ...a, _type: 'article' as const })),
    ...filteredAudits.map(a => ({ ...a, _type: 'audit' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all', label: '全て', count: articles.length + audits.length },
    { key: 'create', label: '記事作成', count: articles.filter(a => a.mode === 'create').length },
    { key: 'improve', label: '記事改善', count: articles.filter(a => a.mode === 'improve').length },
    { key: 'audit', label: 'SEO診断', count: audits.length },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">履歴</h2>
          <p className="text-sm text-gray-500 mt-1">これまでの記事作成・改善・診断の記録</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm transition"
        >
          <RefreshCw size={16} />
          更新
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelected(new Set()) }}
            className={`px-4 py-2 text-sm font-medium rounded-xl border transition ${
              tab === t.key
                ? 'bg-purple-100 text-purple-700 border-purple-300'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : allItems.length === 0 ? (
        <div className="text-center py-12 text-gray-400">まだ履歴がありません</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={toggleAll}
              className="text-sm text-purple-600 hover:text-purple-500 transition"
            >
              {selected.size === allItems.length ? '全解除' : '全選択'}
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{selected.size}件選択中</span>
              {selected.size > 0 && (
                <button
                  onClick={deleteSelected}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {deleting ? '削除中...' : `${selected.size}件を削除`}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {allItems.map((item) => {
              const itemKey = `${item._type}:${item.id}`
              const isSelected = selected.has(itemKey)

              if (item._type === 'article') {
                const isCreate = item.mode === 'create'
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(itemKey)}
                    className={`bg-white border rounded-2xl p-5 shadow-sm cursor-pointer transition ${
                      isSelected ? 'border-purple-400 ring-2 ring-purple-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isCreate ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                          }`}>
                            {isCreate ? '記事作成' : '記事改善'}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-1">
                          {item.title || item.target_keyword || item.source_url || '(タイトルなし)'}
                        </p>
                        {item.meta_description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.meta_description}</p>
                        )}
                        {item.source_url && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <ExternalLink size={12} />
                            {item.source_url}
                          </p>
                        )}
                        {item.seo_score?.overall != null && (
                          <p className="text-xs mt-1">
                            SEOスコア: <span className={`font-medium ${scoreColor(item.seo_score.overall)}`}>{item.seo_score.overall}/100</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              } else {
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(itemKey)}
                    className={`bg-white border rounded-2xl p-5 shadow-sm cursor-pointer transition ${
                      isSelected ? 'border-purple-400 ring-2 ring-purple-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                            SEO診断
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-1 flex items-center gap-1">
                          <Search size={14} className="text-gray-400" />
                          {item.target_url}
                        </p>
                        {item.overall_score != null && (
                          <p className="text-xs mt-1">
                            総合スコア: <span className={`font-medium ${scoreColor(item.overall_score)}`}>{item.overall_score}/100</span>
                          </p>
                        )}
                        {item.checks && Array.isArray(item.checks) && (
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs text-green-500">✅ {item.checks.filter((c: any) => c.status === 'pass').length}</span>
                            <span className="text-xs text-yellow-500">⚠️ {item.checks.filter((c: any) => c.status === 'warn').length}</span>
                            <span className="text-xs text-red-500">❌ {item.checks.filter((c: any) => c.status === 'fail').length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }
            })}
          </div>
        </>
      )}
    </div>
  )
}
