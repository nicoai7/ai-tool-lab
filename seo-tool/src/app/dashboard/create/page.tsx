'use client'

import { useState } from 'react'
import { Search, Loader2, Copy, Check, ChevronRight } from 'lucide-react'

type Outline = {
  heading: string
  recommended_length: string
}

type ArticleResult = {
  title: string
  meta_description: string
  body: string
  internal_links: string[]
}

export default function CreatePage() {
  const [step, setStep] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [outlines, setOutlines] = useState<Outline[]>([])
  const [article, setArticle] = useState<ArticleResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const handleAnalyze = async () => {
    if (!keyword.trim()) return
    setStep(2)
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/seo/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-analyze', keyword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '分析に失敗しました')
      setOutlines(data.outlines || [])
      setStep(3)
    } catch (e: any) {
      setError(e.message)
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setStep(4)
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/seo/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-article', keyword, outlines }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '生成に失敗しました')
      setArticle(data.article || null)
      setStep(5)
    } catch (e: any) {
      setError(e.message)
      setStep(3)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">記事作成</h2>
        <p className="text-sm text-gray-500 mt-1">キーワードからSEO最適化記事を自動生成</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {['キーワード入力', '競合分析', '構成確認', '記事生成', '完成'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
              step > i + 1 ? 'bg-purple-500 text-white' :
              step === i + 1 ? 'bg-purple-500 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {i + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${step === i + 1 ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < 4 && <ChevronRight size={14} className="text-gray-300" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Step 1: Keyword input */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">ターゲットキーワード</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="例：AI 業務効率化 ツール"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button
              onClick={handleAnalyze}
              disabled={!keyword.trim()}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2"
            >
              <Search size={18} />
              競合分析を開始
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Analyzing */}
      {step === 2 && loading && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Loader2 size={40} className="text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">競合サイトを分析中...</p>
          <p className="text-sm text-gray-400 mt-1">上位表示サイトの構成を解析しています</p>
        </div>
      )}

      {/* Step 3: Outline review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">構成案</h3>
            <div className="space-y-3">
              {outlines.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-purple-100 text-purple-600 text-xs rounded-full font-medium">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-800">{item.heading}</span>
                  </div>
                  <span className="text-xs text-gray-400">{item.recommended_length}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-medium transition"
          >
            この構成で記事を生成
          </button>
        </div>
      )}

      {/* Step 4: Generating */}
      {step === 4 && loading && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Loader2 size={40} className="text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">記事を生成中...</p>
          <p className="text-sm text-gray-400 mt-1">SEO最適化された記事を作成しています</p>
        </div>
      )}

      {/* Step 5: Result */}
      {step === 5 && article && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">タイトル案</h3>
              <CopyButton text={article.title} label="title" />
            </div>
            <p className="text-lg font-semibold text-gray-800">{article.title}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">メタディスクリプション</h3>
              <CopyButton text={article.meta_description} label="meta" />
            </div>
            <p className="text-sm text-gray-700">{article.meta_description}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">記事本文</h3>
              <CopyButton text={article.body} label="body" />
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {article.body}
            </div>
          </div>

          {article.internal_links && article.internal_links.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">内部リンク提案</h3>
              <ul className="space-y-2">
                {article.internal_links.map((link, i) => (
                  <li key={i} className="text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                    {link}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
