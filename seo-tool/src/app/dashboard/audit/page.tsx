'use client'

import { useState } from 'react'
import { Search, Loader2, Copy, Check, CheckCircle, AlertTriangle, XCircle, RefreshCw, Filter } from 'lucide-react'

type StatusFilter = 'all' | 'pass' | 'warn' | 'fail' | 'unresolved'

export default function AuditPage() {
  // セッションストレージから前回の結果を復元
  const loadSaved = () => {
    if (typeof window === 'undefined') return null
    const saved = sessionStorage.getItem('audit_result')
    return saved ? JSON.parse(saved) : null
  }

  const saved = loadSaved()

  const [url, setUrl] = useState(saved?.url || '')
  const [step, setStep] = useState<'input' | 'auditing' | 'result'>(saved ? 'result' : 'input')
  const [overallScore, setOverallScore] = useState(saved?.overallScore || 0)
  const [checks, setChecks] = useState<any[]>(saved?.checks || [])
  const [improvementReport, setImprovementReport] = useState(saved?.improvementReport || '')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [resolved, setResolved] = useState<Set<number>>(new Set(saved?.resolved || []))

  const handleAudit = async () => {
    if (!url.trim()) return
    setStep('auditing')
    setError('')
    setResolved(new Set())
    setFilter('all')

    try {
      const res = await fetch('/seo/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'audit', url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '診断に失敗しました')
      const newScore = data.overall_score || 0
      const newChecks = data.checks || []
      const newReport = data.improvement_report || ''
      setOverallScore(newScore)
      setChecks(newChecks)
      setImprovementReport(newReport)
      setStep('result')
      sessionStorage.setItem('audit_result', JSON.stringify({
        url, overallScore: newScore, checks: newChecks, improvementReport: newReport, resolved: [],
      }))
    } catch (e: any) {
      setError(e.message)
      setStep('input')
    }
  }

  const toggleResolved = (index: number) => {
    setResolved(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      // セッションストレージも更新
      const saved = sessionStorage.getItem('audit_result')
      if (saved) {
        const data = JSON.parse(saved)
        data.resolved = Array.from(next)
        sessionStorage.setItem('audit_result', JSON.stringify(data))
      }
      return next
    })
  }

  const handleCopyReport = async () => {
    await navigator.clipboard.writeText(improvementReport || buildSimpleReport())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const buildSimpleReport = () => {
    let report = `SEO診断レポート\nURL: ${url}\n総合スコア: ${overallScore}/100\n\n`
    checks.forEach((check: any, i: number) => {
      const label = check.status === 'pass' ? '✅ OK' : check.status === 'warn' ? '⚠️ 注意' : '❌ 要改善'
      const resolvedLabel = resolved.has(i) ? ' [対応済]' : ''
      report += `${label}${resolvedLabel} ${check.item}\n`
      if (check.what_is) report += `  → ${check.what_is}\n`
      report += `  ${check.detail}\n`
      if (check.how_to_fix) report += `  💡 ${check.how_to_fix}\n`
      report += '\n'
    })
    return report
  }

  const statusConfig: any = {
    pass: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', label: 'OK' },
    warn: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', label: '注意' },
    fail: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: '要改善' },
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  // フィルター適用済みのチェックにグローバルインデックスを付与
  const indexedChecks = checks.map((check, i) => ({ ...check, _index: i }))

  const filteredChecks = indexedChecks.filter((check) => {
    if (filter === 'all') return true
    if (filter === 'pass') return check.status === 'pass'
    if (filter === 'warn') return check.status === 'warn'
    if (filter === 'fail') return check.status === 'fail'
    if (filter === 'unresolved') return check.status !== 'pass' && !resolved.has(check._index)
    return true
  })

  // カテゴリでグループ化
  const groupedChecks = filteredChecks.reduce((acc: any, check: any) => {
    const cat = check.category || 'その他'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(check)
    return acc
  }, {})

  // カウント
  const counts = {
    all: checks.length,
    pass: checks.filter(c => c.status === 'pass').length,
    warn: checks.filter(c => c.status === 'warn').length,
    fail: checks.filter(c => c.status === 'fail').length,
    unresolved: checks.filter((c, i) => c.status !== 'pass' && !resolved.has(i)).length,
  }

  const filterButtons: { key: StatusFilter; label: string; color: string; activeColor: string }[] = [
    { key: 'all', label: `全て (${counts.all})`, color: 'text-gray-600', activeColor: 'bg-purple-100 text-purple-700 border-purple-300' },
    { key: 'fail', label: `要改善 (${counts.fail})`, color: 'text-red-600', activeColor: 'bg-red-100 text-red-700 border-red-300' },
    { key: 'warn', label: `注意 (${counts.warn})`, color: 'text-yellow-600', activeColor: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { key: 'pass', label: `OK (${counts.pass})`, color: 'text-green-600', activeColor: 'bg-green-100 text-green-700 border-green-300' },
    { key: 'unresolved', label: `未対応 (${counts.unresolved})`, color: 'text-orange-600', activeColor: 'bg-orange-100 text-orange-700 border-orange-300' },
  ]

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">SEO診断</h2>
        <p className="text-sm text-gray-500 mt-1">サイトのSEO状態を総合診断</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Input */}
      {step === 'input' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">診断対象URL</label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="https://example.com"
              onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
            />
            <button
              onClick={handleAudit}
              disabled={!url.trim()}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2"
            >
              <Search size={18} />
              診断を開始
            </button>
          </div>
        </div>
      )}

      {/* Auditing */}
      {step === 'auditing' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
          <Loader2 size={40} className="text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">SEO診断中...</p>
          <p className="text-sm text-gray-400 mt-1">サイトの各項目をチェックしています（30秒〜1分）</p>
        </div>
      )}

      {/* Result */}
      {step === 'result' && (
        <div className="space-y-4">
          {/* Overall Score */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center">
            <p className="text-sm text-gray-500 mb-2">総合スコア</p>
            <p className={`text-6xl font-bold ${scoreColor(overallScore)}`}>
              {overallScore}
            </p>
            <p className="text-sm text-gray-400 mt-1">/ 100</p>
            <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
              <span>対応済: {resolved.size}件</span>
              <span>未対応: {counts.unresolved}件</span>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={16} className="text-gray-400" />
              {filterButtons.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setFilter(btn.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                    filter === btn.key
                      ? btn.activeColor
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Checks by Category */}
          {Object.keys(groupedChecks).length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center text-gray-400">
              該当する項目がありません
            </div>
          ) : (
            Object.entries(groupedChecks).map(([category, items]: [string, any]) => (
              <div key={category} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">{category}</h3>
                <div className="space-y-2">
                  {items.map((check: any) => {
                    const idx = check._index
                    const status = check.status || 'warn'
                    const isResolved = resolved.has(idx)
                    const config = statusConfig[status] || statusConfig.warn
                    const Icon = isResolved ? CheckCircle : config.icon
                    const displayBg = isResolved ? 'bg-gray-50' : config.bg
                    const displayBorder = isResolved ? 'border-gray-200' : config.border
                    const displayColor = isResolved ? 'text-gray-400' : config.color
                    return (
                      <div key={idx} className={`p-3 rounded-xl ${displayBg} border ${displayBorder} transition ${isResolved ? 'opacity-60' : ''}`}>
                        <div className="flex items-start gap-3">
                          <Icon size={18} className={`${isResolved ? 'text-green-400' : config.color} mt-0.5 shrink-0`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-medium ${isResolved ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{check.item}</p>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-xs font-medium ${displayColor}`}>
                                  {isResolved ? '対応済' : config.label}
                                </span>
                                {status !== 'pass' && (
                                  <button
                                    onClick={() => toggleResolved(idx)}
                                    className={`text-xs px-2 py-0.5 rounded-md border transition ${
                                      isResolved
                                        ? 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100'
                                        : 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'
                                    }`}
                                  >
                                    {isResolved ? '未対応に戻す' : '対応済にする'}
                                  </button>
                                )}
                              </div>
                            </div>
                            {check.what_is && (
                              <p className="text-xs text-gray-400 mt-0.5">ℹ️ {check.what_is}</p>
                            )}
                            <p className={`text-sm mt-1 ${isResolved ? 'text-gray-400' : 'text-gray-600'}`}>{check.detail}</p>
                            {check.how_to_fix && (
                              <p className={`text-sm mt-1 ${isResolved ? 'text-gray-400' : 'text-gray-500'}`}>💡 {check.how_to_fix}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('input'); setUrl(''); setOverallScore(0); setChecks([]); setImprovementReport(''); setResolved(new Set()); setFilter('all'); sessionStorage.removeItem('audit_result') }}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              別のURLを診断
            </button>
            <button
              onClick={handleCopyReport}
              className="flex-1 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'コピー済み' : '改善指示書をコピー'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
