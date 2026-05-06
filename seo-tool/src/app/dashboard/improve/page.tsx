'use client'

import { useState } from 'react'
import { Search, Loader2, Copy, Check, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

export default function ImprovePage() {
  const loadSaved = () => {
    if (typeof window === 'undefined') return null
    const saved = sessionStorage.getItem('improve_result')
    return saved ? JSON.parse(saved) : null
  }
  const saved = loadSaved()

  const [url, setUrl] = useState(saved?.url || '')
  const [step, setStep] = useState<'input' | 'analyzing' | 'result' | 'generating' | 'improved'>(saved ? (saved.improved ? 'improved' : 'result') : 'input')
  const [seoScore, setSeoScore] = useState<any>(saved?.seoScore || null)
  const [suggestions, setSuggestions] = useState<any[]>(saved?.suggestions || [])
  const [articleId, setArticleId] = useState(saved?.articleId || '')
  const [improved, setImproved] = useState<any>(saved?.improved || null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const handleAnalyze = async () => {
    if (!url.trim()) return
    setStep('analyzing')
    setError('')

    try {
      const res = await fetch('/seo/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'improve-analyze', url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '分析に失敗しました')
      const newScore = data.seo_score || null
      const newSuggestions = data.suggestions || []
      const newArticleId = data.article_id || ''
      setSeoScore(newScore)
      setSuggestions(newSuggestions)
      setArticleId(newArticleId)
      setStep('result')
      sessionStorage.setItem('improve_result', JSON.stringify({ url, seoScore: newScore, suggestions: newSuggestions, articleId: newArticleId, improved: null }))
    } catch (e: any) {
      setError(e.message)
      setStep('input')
    }
  }

  const handleRewrite = async () => {
    if (!articleId) return
    setStep('generating')
    setError('')

    try {
      const res = await fetch('/seo/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'improve-rewrite', article_id: articleId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '生成に失敗しました')
      setImproved(data)
      setStep('improved')
      const savedData = sessionStorage.getItem('improve_result')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        parsed.improved = data
        sessionStorage.setItem('improve_result', JSON.stringify(parsed))
      }
    } catch (e: any) {
      setError(e.message)
      setStep('result')
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

  const priorityConfig: any = {
    high: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, label: '高' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertTriangle, label: '中' },
    low: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, label: '低' },
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const barColor = (score: number) => {
    if (score >= 80) return 'bg-green-400'
    if (score >= 60) return 'bg-yellow-400'
    return 'bg-red-400'
  }

  const scoreCategories = seoScore ? [
    { name: 'タイトル', score: seoScore.title || 0 },
    { name: '見出し構造', score: seoScore.headings || 0 },
    { name: 'キーワード密度', score: seoScore.keywords || 0 },
    { name: 'メタ情報', score: seoScore.meta || 0 },
    { name: '読みやすさ', score: seoScore.readability || 0 },
  ] : []

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">記事改善</h2>
        <p className="text-sm text-gray-500 mt-1">既存記事のSEOスコアを分析・改善</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Input */}
      {step === 'input' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">記事URL</label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="https://example.com/article"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button
              onClick={handleAnalyze}
              disabled={!url.trim()}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2"
            >
              <Search size={18} />
              分析を開始
            </button>
          </div>
        </div>
      )}

      {/* Analyzing */}
      {step === 'analyzing' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
          <Loader2 size={40} className="text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">記事を分析中...</p>
          <p className="text-sm text-gray-400 mt-1">URLの内容を取得してSEOスコアを計算しています（30秒〜1分）</p>
        </div>
      )}

      {/* Analysis Result */}
      {step === 'result' && seoScore && (
        <div className="space-y-4">
          {/* Overall Score */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">総合スコア</p>
            <p className={`text-6xl font-bold ${scoreColor(seoScore.overall || 0)}`}>
              {seoScore.overall || 0}
            </p>
            <p className="text-sm text-gray-400 mt-1">/ 100</p>
          </div>

          {/* Category Scores */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">カテゴリ別スコア</h3>
            <div className="space-y-3">
              {scoreCategories.map((cat, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{cat.name}</span>
                    <span className={`text-sm font-medium ${scoreColor(cat.score)}`}>{cat.score}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${barColor(cat.score)} transition-all`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">改善提案</h3>
              <div className="space-y-2">
                {suggestions.map((sug: any, i: number) => {
                  const priority = sug.priority || 'medium'
                  const config = priorityConfig[priority] || priorityConfig.medium
                  const Icon = config.icon
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${config.bg} border ${config.border}`}>
                      <Icon size={18} className={`${config.color} mt-0.5 shrink-0`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{sug.category}</p>
                        {sug.what_is && <p className="text-xs text-gray-400 mt-0.5 mb-1">ℹ️ {sug.what_is}</p>}
                        <p className="text-sm text-gray-600">{sug.issue}</p>
                        <p className="text-sm text-gray-500 mt-1">💡 {sug.suggestion}</p>
                      </div>
                      <span className={`text-xs font-medium ${config.color} shrink-0`}>優先度：{config.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('input'); setUrl(''); setSeoScore(null); setSuggestions([]); setArticleId(''); sessionStorage.removeItem('improve_result') }}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              別のURLを分析
            </button>
            <button
              onClick={handleRewrite}
              className="flex-1 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-medium transition"
            >
              修正版を生成
            </button>
          </div>
        </div>
      )}

      {/* Generating */}
      {step === 'generating' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
          <Loader2 size={40} className="text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">修正版を生成中...</p>
          <p className="text-sm text-gray-400 mt-1">改善提案を反映した記事を作成しています（1〜2分）</p>
        </div>
      )}

      {/* Improved Article */}
      {step === 'improved' && improved && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">改善後タイトル</h3>
              <CopyButton text={improved.title} label="title" />
            </div>
            <p className="text-lg font-semibold text-gray-800">{improved.title}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">改善後メタディスクリプション</h3>
              <CopyButton text={improved.meta_description} label="meta" />
            </div>
            <p className="text-sm text-gray-700">{improved.meta_description}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">改善後記事本文</h3>
              <CopyButton text={improved.body_markdown} label="body" />
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
              {improved.body_markdown}
            </div>
          </div>

          <button
            onClick={() => { setStep('input'); setUrl(''); setSeoScore(null); setSuggestions([]); setArticleId(''); setImproved(null); sessionStorage.removeItem('improve_result') }}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            別のURLを分析
          </button>
        </div>
      )}
    </div>
  )
}
