'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Check } from 'lucide-react'

type Article = {
  id: string
  title: string
  meta_description: string
  body: string
  keyword: string
  mode: 'create' | 'improve'
  suggestions: string[] | null
  created_at: string
}

export default function ArticleDetailPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    const fetchArticle = async () => {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('id', params.id)
        .single()

      setArticle(data)
      setLoading(false)
    }
    fetchArticle()
  }, [params.id])

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => copyText(text, label)}
      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
    >
      {copied === label ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
      {copied === label ? 'コピー済み' : 'コピー'}
    </button>
  )

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">読み込み中...</div>
  }

  if (!article) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">記事が見つかりません</p>
        <button onClick={() => router.push('/dashboard/history')} className="text-purple-500 text-sm hover:underline">
          履歴に戻る
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push('/dashboard/history')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition"
      >
        <ArrowLeft size={16} />
        履歴に戻る
      </button>

      <div className="space-y-4">
        {/* Title */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-500">タイトル</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                article.mode === 'create' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'
              }`}>
                {article.mode === 'create' ? '新規作成' : '改善'}
              </span>
            </div>
            <CopyButton text={article.title} label="title" />
          </div>
          <p className="text-lg font-semibold text-gray-800">{article.title}</p>
          {article.keyword && (
            <p className="text-xs text-gray-400 mt-2">キーワード: {article.keyword}</p>
          )}
        </div>

        {/* Meta Description */}
        {article.meta_description && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">メタディスクリプション</h3>
              <CopyButton text={article.meta_description} label="meta" />
            </div>
            <p className="text-sm text-gray-700">{article.meta_description}</p>
          </div>
        )}

        {/* Body */}
        {article.body && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">記事本文</h3>
              <CopyButton text={article.body} label="body" />
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
              {article.body}
            </div>
          </div>
        )}

        {/* Suggestions (improve mode) */}
        {article.mode === 'improve' && article.suggestions && article.suggestions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">改善提案</h3>
            <ul className="space-y-2">
              {article.suggestions.map((sug, i) => (
                <li key={i} className="text-sm text-gray-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl">
                  {sug}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Date */}
        <p className="text-xs text-gray-400 text-right">
          作成日: {new Date(article.created_at).toLocaleDateString('ja-JP')}
        </p>
      </div>
    </div>
  )
}
