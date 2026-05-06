'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StarRating from '@/components/StarRating';
import { useCompetitorData } from '@/hooks/useCompetitorData';
import { Search, ExternalLink, ArrowUpDown, Loader2, Zap, PenLine } from 'lucide-react';

type SortKey = 'totalScore' | 'daysRunning' | 'variations' | 'freshnessScore';
type AnalysisMode = 'auto' | 'manual';

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function scoreBarWidth(score: number, max: number): string {
  return `${(score / max) * 100}%`;
}

const PICK_PRESETS = [5, 10, 15, 20, 25, 30];

const GENRE_PRESETS = [
  'EC・通販', '美容・コスメ', '健康食品・サプリ', '不動産', '教育・スクール',
  '飲食・フード', 'アパレル・ファッション', '旅行・ホテル', 'SaaS・IT',
  'フィットネス・ジム', '金融・保険', '人材・採用', '医療・クリニック',
];

export default function CompetitorsPage() {
  const [sortKey, setSortKey] = useState<SortKey>('totalScore');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickCount, setPickCount] = useState(10);
  const [customCountInput, setCustomCountInput] = useState('');
  const [showCustomCount, setShowCustomCount] = useState(false);

  // 分析モード
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('auto');
  const [genreInput, setGenreInput] = useState('');
  const [descInput, setDescInput] = useState('');

  const { data: competitors, loading, error, isDemo, refetch, fetchManual, mode } = useCompetitorData();

  const filtered = competitors
    .filter(c =>
      c.advertiser.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.adTitle.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortAsc ? diff : -diff;
    })
    .slice(0, pickCount);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const handleManualSubmit = () => {
    if (!genreInput.trim() && !descInput.trim()) return;
    fetchManual(genreInput.trim(), descInput.trim());
  };

  return (
    <div>
      <PageHeader title="競合分析" subtitle="競合広告のバズスコアを分析し、自社改善案を抽出します" />

      {/* 分析モード切替 */}
      <div className="bg-card-bg rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setAnalysisMode('auto')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              analysisMode === 'auto'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-border hover:bg-gray-50'
            }`}
          >
            <Zap size={14} />
            広告アカウントから自動分析
          </button>
          <button
            onClick={() => setAnalysisMode('manual')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              analysisMode === 'manual'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-border hover:bg-gray-50'
            }`}
          >
            <PenLine size={14} />
            ジャンル・サービスを指定して分析
          </button>
        </div>

        {analysisMode === 'auto' ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">
              接続済みの広告アカウントのキャンペーン名・広告名からジャンルを自動判定し、競合分析を生成します。
            </p>
            <button
              onClick={refetch}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              既存広告から競合を分析
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted mb-3">
              広告を配信していない場合でも、ジャンルやサービス内容を入力して競合分析ができます。
            </p>

            {/* ジャンルプリセット */}
            <div className="mb-3">
              <label className="text-xs font-medium text-foreground/70 block mb-1.5">ジャンル（選択または入力）</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {GENRE_PRESETS.map(g => (
                  <button
                    key={g}
                    onClick={() => setGenreInput(g)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      genreInput === g
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-600 border-border hover:bg-gray-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={genreInput}
                onChange={e => setGenreInput(e.target.value)}
                placeholder="例: ペットフード、オンライン英会話、家具・インテリア..."
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* サービス内容 */}
            <div className="mb-4">
              <label className="text-xs font-medium text-foreground/70 block mb-1.5">サービス内容・補足（任意）</label>
              <textarea
                value={descInput}
                onChange={e => setDescInput(e.target.value)}
                placeholder="例: 20代女性向けのオーガニックスキンケアブランド。主力商品はクレンジングオイルとセラム。価格帯は3,000〜8,000円。"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <button
              onClick={handleManualSubmit}
              disabled={loading || (!genreInput.trim() && !descInput.trim())}
              className="px-6 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              競合分析を実行
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">
            {analysisMode === 'auto'
              ? '広告アカウントのジャンルを分析し、競合情報を生成中...'
              : '指定されたジャンルの競合情報を生成中...'}
          </span>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}
      {isDemo && !loading && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          デモデータを表示中です。広告アカウントを接続するか、ジャンルを指定して分析を実行してください。
        </div>
      )}

      {/* 検索バー + ピックアップ数 */}
      {!loading && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="広告主名・広告タイトルで検索..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p className="text-xs text-muted">{filtered.length}件表示</p>
          </div>

          {/* ピックアップ数の選択 */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs text-muted">表示件数:</span>
            {PICK_PRESETS.map(n => (
              <button
                key={n}
                onClick={() => { setPickCount(n); setShowCustomCount(false); }}
                className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                  pickCount === n && !showCustomCount
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-border hover:bg-gray-50'
                }`}
              >
                {n}件
              </button>
            ))}
            <button
              onClick={() => setShowCustomCount(!showCustomCount)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                showCustomCount
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-border hover:bg-gray-50'
              }`}
            >
              カスタム
            </button>
            {showCustomCount && (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  value={customCountInput}
                  onChange={e => setCustomCountInput(e.target.value)}
                  placeholder="件数"
                  className="w-16 px-2 py-1 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={() => {
                    const n = parseInt(customCountInput, 10);
                    if (n > 0) setPickCount(n);
                  }}
                  className="px-2 py-1 text-xs bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  適用
                </button>
              </div>
            )}
          </div>

          {/* 競合広告カード一覧 */}
          <div className="space-y-4">
            {/* ソートバー */}
            <div className="flex items-center gap-4 text-xs text-muted">
              <span>並び替え:</span>
              {([
                { key: 'totalScore' as SortKey, label: 'バズスコア' },
                { key: 'daysRunning' as SortKey, label: '配信日数' },
                { key: 'variations' as SortKey, label: 'バリエーション数' },
                { key: 'freshnessScore' as SortKey, label: '鮮度' },
              ]).map(item => (
                <button
                  key={item.key}
                  onClick={() => handleSort(item.key)}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                    sortKey === item.key ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                  <ArrowUpDown size={10} />
                </button>
              ))}
            </div>

            {filtered.map(comp => (
              <div key={comp.id} className="bg-card-bg rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-5">
                  {/* バズスコア */}
                  <div className="flex-shrink-0 text-center w-24">
                    <div className={`text-3xl font-bold rounded-xl px-3 py-2 border ${scoreColor(comp.totalScore)}`}>
                      {comp.totalScore}
                    </div>
                    <p className="text-[10px] text-muted mt-1">バズスコア</p>
                    <StarRating score={comp.totalScore / 20} size={12} showScore={false} />
                  </div>

                  {/* 広告情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted">{comp.advertiser}</span>
                      <div className="flex gap-1">
                        {comp.platforms.map(p => (
                          <span key={p} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    <h4 className="font-semibold mb-2">{comp.adTitle}</h4>

                    {/* スコア内訳バー */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      {[
                        { label: '配信規模', score: comp.scaleScore, max: 30, color: '#4361ee' },
                        { label: '鮮度', score: comp.freshnessScore, max: 20, color: '#10b981' },
                        { label: '話題性', score: comp.buzzScore, max: 25, color: '#f59e0b' },
                        { label: 'クリエイティブ力', score: comp.creativeScore, max: 25, color: '#ef4444' },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="flex justify-between text-[10px] text-muted mb-0.5">
                            <span>{item.label}</span>
                            <span>{item.score}/{item.max}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: scoreBarWidth(item.score, item.max), backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* メタ情報 */}
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span>配信開始: {comp.startDate}</span>
                      <span>配信日数: {comp.daysRunning}日</span>
                      <span>バリエーション: {comp.variations}本</span>
                    </div>

                    {/* 自社への示唆 */}
                    <div className="mt-3 bg-primary/5 rounded-lg px-4 py-2.5 border border-primary/10">
                      <p className="text-xs font-medium text-primary">自社への示唆: {comp.suggestion}</p>
                    </div>

                    {/* 広告ライブラリリンク */}
                    <div className="mt-2 flex items-center gap-3">
                      <a
                        href={comp.adLibraryUrl || `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=JP&q=${encodeURIComponent(comp.advertiser)}&search_type=keyword_unordered&media_type=all`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink size={10} />
                        実際の広告を見る
                      </a>
                      {comp.websiteUrl && (
                        <a
                          href={comp.websiteUrl.startsWith('http') ? comp.websiteUrl : `https://${comp.websiteUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700"
                        >
                          <ExternalLink size={10} />
                          公式サイト
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 詳細リンク */}
                  <Link
                    href={`/competitors/detail?id=${comp.id}`}
                    className="flex-shrink-0 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-1"
                  >
                    詳細
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
