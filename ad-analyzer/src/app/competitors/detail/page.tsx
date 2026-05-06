'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import StarRating from '@/components/StarRating';
import { useCompetitorData } from '@/hooks/useCompetitorData';
import { ArrowLeft, Loader2, ExternalLink } from 'lucide-react';

function scoreColor(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.8) return 'text-green-600';
  if (pct >= 0.5) return 'text-yellow-600';
  return 'text-red-600';
}

function DetailContent() {
  const params = useSearchParams();
  const id = params.get('id');
  const { data: competitors, loading } = useCompetitorData();
  const comp = competitors.find(c => c.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-sm">競合データを読み込み中...</span>
      </div>
    );
  }

  if (!comp) {
    return (
      <div className="text-center py-20 text-muted">
        <p>競合広告が見つかりません</p>
        <Link href="/competitors" className="text-primary mt-2 inline-block">← 一覧に戻る</Link>
      </div>
    );
  }

  const adLibraryUrl = comp.adLibraryUrl || `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=JP&q=${encodeURIComponent(comp.advertiser)}&search_type=keyword_unordered&media_type=all`;

  const categories = [
    {
      label: '配信規模',
      score: comp.scaleScore,
      max: 30,
      color: '#4361ee',
      details: [
        { label: '配信期間', value: comp.scaleDetail.period },
        { label: 'プラットフォーム数', value: `${comp.scaleDetail.platformCount}媒体（${comp.platforms.join('、')}）` },
        { label: 'クリエイティブバリエーション数', value: `${comp.scaleDetail.variationCount}本` },
      ],
      scoring: [
        { label: '配信期間', score: Math.min(10, Math.round(comp.daysRunning / 10)), max: 10, desc: comp.daysRunning >= 30 ? '30日以上の安定配信' : '配信開始から日が浅い' },
        { label: 'プラットフォーム数', score: Math.min(10, comp.scaleDetail.platformCount * 4), max: 10, desc: `${comp.scaleDetail.platformCount}媒体に配信中` },
        { label: 'バリエーション数', score: Math.min(10, Math.round(comp.scaleDetail.variationCount * 1.2)), max: 10, desc: `${comp.scaleDetail.variationCount}本のクリエイティブを展開` },
      ],
    },
    {
      label: '鮮度',
      score: comp.freshnessScore,
      max: 20,
      color: '#10b981',
      details: [
        { label: '配信開始日', value: comp.freshnessDetail.startDate },
        { label: '経過日数', value: `${comp.freshnessDetail.daysAgo}日` },
        { label: 'リーセンシー', value: comp.freshnessDetail.recency },
      ],
      scoring: [
        { label: '配信開始からの日数', score: comp.freshnessScore, max: 20, desc: comp.freshnessDetail.daysAgo <= 14 ? '直近2週間以内の新規広告（高スコア）' : comp.freshnessDetail.daysAgo <= 30 ? '1ヶ月以内の比較的新しい広告' : '配信開始から時間が経過' },
      ],
    },
    {
      label: '話題性',
      score: comp.buzzScore,
      max: 25,
      color: '#f59e0b',
      details: [
        { label: 'SNS言及数（推定）', value: `${comp.buzzDetail.snsMentions}件` },
        { label: '検索トレンド', value: comp.buzzDetail.searchTrend },
        { label: 'トレンドスコア', value: comp.buzzDetail.trendScore },
      ],
      scoring: [
        { label: 'SNS言及数', score: Math.min(15, Math.round(comp.buzzDetail.snsMentions / 40)), max: 15, desc: `推定${comp.buzzDetail.snsMentions}件の言及` },
        { label: 'Google検索トレンド', score: comp.buzzDetail.searchTrend === '急上昇' ? 10 : comp.buzzDetail.searchTrend === '上昇トレンド' ? 7 : 3, max: 10, desc: `検索トレンド: ${comp.buzzDetail.searchTrend}` },
      ],
    },
    {
      label: 'クリエイティブ力',
      score: comp.creativeScore,
      max: 25,
      color: '#ef4444',
      details: [
        { label: 'フォーマット', value: comp.creativeDetail.format },
        { label: 'コピーの強さ', value: comp.creativeDetail.copyStrength },
        { label: 'ビジュアルインパクト', value: comp.creativeDetail.visualImpact },
        { label: 'CTAの明確さ', value: comp.creativeDetail.ctaClarity },
      ],
      scoring: [
        { label: 'AI訴求力分析', score: Math.round(comp.creativeScore * 0.6), max: 15, desc: comp.creativeAnalysis.slice(0, 60) + '...' },
        { label: 'コピー分析', score: Math.round(comp.creativeScore * 0.4), max: 10, desc: `コピーの強さ: ${comp.creativeDetail.copyStrength}` },
      ],
    },
  ];

  return (
    <div>
      {/* 戻るリンク */}
      <Link
        href="/competitors"
        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        競合分析一覧に戻る
      </Link>

      {/* ヘッダー */}
      <div className="bg-card-bg rounded-xl border border-border p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0 text-center">
            <div className="text-5xl font-bold text-primary mb-1">{comp.totalScore}</div>
            <StarRating score={comp.totalScore / 20} size={18} showScore={false} />
            <p className="text-xs text-muted mt-1">バズスコア / 100</p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted font-medium mb-1">{comp.advertiser}</p>
            <h2 className="text-xl font-bold mb-2">{comp.adTitle}</h2>
            <div className="flex gap-2 mb-3">
              {comp.platforms.map(p => (
                <span key={p} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">{p}</span>
              ))}
            </div>
            <p className="text-sm text-foreground/70">{comp.creativeAnalysis}</p>
          </div>
        </div>
      </div>

      {/* 実際の広告を確認 */}
      <div className="bg-card-bg rounded-xl border border-border p-5 mb-6">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <ExternalLink size={14} />
          実際の広告クリエイティブを確認
        </h3>
        <p className="text-xs text-muted mb-4">
          「{comp.advertiser}」が実際に配信している広告のクリエイティブ、テキスト、遷移先LPをMeta広告ライブラリで確認できます。
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={adLibraryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink size={14} />
            Meta広告ライブラリで広告を見る
          </a>
          {comp.websiteUrl && (
            <a
              href={comp.websiteUrl.startsWith('http') ? comp.websiteUrl : `https://${comp.websiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-border hover:bg-gray-50 transition-colors"
            >
              <ExternalLink size={14} />
              公式サイトを見る
            </a>
          )}
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-muted leading-relaxed">
            広告ライブラリでは、配信中の広告クリエイティブ（画像/動画）、広告テキスト、CTAボタンの遷移先LPを確認できます。
          </p>
        </div>
      </div>

      {/* 心理トリガー */}
      <div className="bg-card-bg rounded-xl border border-border p-5 mb-6">
        <h3 className="text-sm font-bold mb-3">検出された訴求トリガー</h3>
        <div className="flex flex-wrap gap-2">
          {comp.appealTriggers.map((trigger, i) => (
            <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
              {trigger}
            </span>
          ))}
        </div>
      </div>

      {/* スコア内訳 */}
      <div className="space-y-4 mb-6">
        {categories.map(cat => (
          <div key={cat.label} className="bg-card-bg rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <h3 className="text-sm font-bold">{cat.label}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${scoreColor(cat.score, cat.max)}`}>{cat.score}</span>
                <span className="text-sm text-muted">/ {cat.max}</span>
              </div>
            </div>

            {/* プログレスバー */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(cat.score / cat.max) * 100}%`, backgroundColor: cat.color }}
              />
            </div>

            {/* データ */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {cat.details.map((d, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-muted mb-0.5">{d.label}</p>
                  <p className="text-sm font-medium">{d.value}</p>
                </div>
              ))}
            </div>

            {/* スコアリング根拠 */}
            <div className="space-y-2">
              {cat.scoring.map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-32 text-muted flex-shrink-0">{s.label}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(s.score / s.max) * 100}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <span className="font-medium w-12 flex-shrink-0">{s.score}/{s.max}</span>
                    <span className="text-muted truncate">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 自社への改善提案 */}
      <div className="bg-primary/5 rounded-xl border border-primary/20 p-6">
        <h3 className="text-sm font-bold text-primary mb-3">この競合から学べること</h3>
        <p className="text-sm leading-relaxed">{comp.suggestion}</p>
        <div className="mt-4 pt-4 border-t border-primary/10">
          <p className="text-xs text-muted">この分析結果は、Meta広告ライブラリの実データとAI分析を組み合わせて生成されています。</p>
        </div>
      </div>
    </div>
  );
}

export default function CompetitorDetailPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted">読み込み中...</div>}>
      <DetailContent />
    </Suspense>
  );
}
