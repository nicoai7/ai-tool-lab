'use client';

import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/PageHeader';
import StarRating from '@/components/StarRating';
import { Sparkles, TrendingDown, Target, Clock, Users, Zap, ChevronDown, ChevronUp, Filter, Loader2 } from 'lucide-react';
import {
  mockDailyData, mockWeekdayData, mockHourlyData,
  mockDeviceData, mockGenderData, mockAgeData,
  mockCampaignData, mockAdCreatives, mockAccountSummary,
} from '@/lib/mock-data';

// --- 改善スコアリング ---
const defaultOverallScore = 2.5;

const categoryScores = [
  { label: 'クリエイティブ', score: 2.0, comment: '効率の悪い広告が予算を圧迫' },
  { label: 'ターゲティング', score: 3.0, comment: '年齢層の絞り込みに余地あり' },
  { label: '配信設定', score: 2.0, comment: '時間帯・曜日の最適化が不十分' },
  { label: '予算配分', score: 3.0, comment: '概ね適切だが微調整で改善可能' },
  { label: '入札戦略', score: 2.5, comment: 'CPC上昇への対策が必要' },
];

// --- ステータス型 ---
type Status = '未対応' | '対応済み' | '却下';

const statusConfig: Record<Status, { bg: string; text: string }> = {
  '未対応': { bg: 'bg-orange-100', text: 'text-orange-800' },
  '対応済み': { bg: 'bg-green-100', text: 'text-green-800' },
  '却下': { bg: 'bg-gray-100', text: 'text-gray-600' },
};

// --- 改善案データ ---
interface Improvement {
  id: string;
  icon: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  action: string;
  howTo: { method: string; steps: string }[];
}

const improvements: Improvement[] = [
  {
    id: 'imp_1',
    icon: 'creative',
    category: 'クリエイティブ',
    severity: 'high',
    title: 'CPA ¥5,000超の広告を停止',
    detail: '複数の広告でCPAが¥5,000を超えており、予算を圧迫しています。CPAが最も良好な「広告1」（CPA ¥5,260）と比較し、効率の悪い広告は停止を推奨します。',
    action: 'CPA ¥5,000超の広告を停止し、高効率クリエイティブのバリエーションを追加テスト',
    howTo: [
      { method: '広告マネージャから手動停止', steps: '広告マネージャ → 上部タブ「広告」→ 該当広告のトグルをOFF' },
      { method: '自動ルールで条件付き停止', steps: '広告マネージャ →「自動ルール」→「ルール作成」→ 条件「結果の単価が¥5,000以上」→ アクション「広告をオフにする」' },
    ],
  },
  {
    id: 'imp_2',
    icon: 'target',
    category: 'ターゲット',
    severity: 'high',
    title: '45歳以上をコアターゲットに集中',
    detail: '45-54歳・55-64歳・65+の3セグメントでCVの大部分を獲得。25-34歳以下はCVR・CPAとも劣るため、予算の集中配分を推奨。',
    action: '年齢下限を35歳以上に変更し、45歳以上への予算比率を上げる',
    howTo: [
      { method: '新規広告セットでテスト（推奨）', steps: '広告セットを複製 →「オーディエンス」→ 年齢「45〜65+」性別「女性」に設定 → 既存セットと並行運用' },
      { method: 'Advantage+の提案を活用', steps: '広告セット編集 →「Advantage+オーディエンス」→「オーディエンスの提案」で45歳以上の興味関心を追加' },
    ],
  },
  {
    id: 'imp_3',
    icon: 'clock',
    category: '配信設定',
    severity: 'medium',
    title: '水曜日に予算を集中配分',
    detail: '水曜日のCVR 67.52%は突出して高く、CPA ¥31と最も効率的。一方、日曜・土曜はCVR 1%未満でCPA ¥13,000超。曜日別の予算配分を最適化すべき。',
    action: '水曜日の予算を30%増額、日曜・土曜を20%減額',
    howTo: [
      { method: '自動ルールで曜日別予算増減', steps: '「自動ルール」→ ルール①：水曜0:00に「1日の予算を30%増額」→ ルール②：木曜0:00に「1日の予算を30%減額」（戻し用）' },
      { method: '通算予算+スケジュール配信', steps: '広告セット編集 → 予算を「通算予算」に変更 →「広告スケジュール」で水曜の配信時間を拡大' },
    ],
  },
  {
    id: 'imp_4',
    icon: 'clock',
    category: '配信設定',
    severity: 'medium',
    title: '深夜〜早朝の配信を停止',
    detail: '1〜6時台は合計クリック37件、CV8件でCPAも悪い。この時間帯の広告費を削減し、ゴールデンタイム（18-22時）に集中すべき。',
    action: '0-9時の配信を停止し、18-22時に予算集中',
    howTo: [
      { method: 'スケジュール配信（通算予算）', steps: '広告セット編集 → 予算を「通算予算」に変更 →「広告スケジュール」で18:00〜22:00のみチェック' },
      { method: '自動ルールでオン/オフ', steps: '「自動ルール」→ ルール①：毎日18:00に「広告セットをオン」→ ルール②：毎日22:00に「広告セットをオフ」' },
    ],
  },
  {
    id: 'imp_5',
    icon: 'users',
    category: 'ターゲット',
    severity: 'medium',
    title: '女性をメインターゲットに設定',
    detail: '女性CVR 27.26%、男性CVR 23.19%。女性のCPA ¥284は男性¥328より13.4%良好。獲得件数でも女性256件 vs 男性93件と圧倒的。',
    action: '女性を優先ターゲットに設定し、女性向けクリエイティブを強化',
    howTo: [
      { method: 'オーディエンス設定を変更', steps: '広告セット編集 →「オーディエンス」→ 性別「女性」を選択 → 保存' },
      { method: '女性専用広告セットを作成', steps: '広告セット複製 → 性別「女性」に設定 → 女性に響くクリエイティブを入稿 → 既存セットは「すべて」のまま比較テスト' },
    ],
  },
  {
    id: 'imp_6',
    icon: 'creative',
    category: 'クリエイティブ',
    severity: 'medium',
    title: '高効率広告の新規クリエイティブ追加',
    detail: '「広告1」はクリック637件で最も多く、訴求がユーザーに刺さっている。バリエーションを増やしてテストすべき。',
    action: '高効率広告の画像・テキスト違いのクリエイティブを2〜3本追加',
    howTo: [
      { method: '既存広告を複製して編集', steps: '「広告1」にチェック →「複製」→ メインテキストや画像を差し替え →「公開する」' },
      { method: 'テキストバリエーション機能', steps: '広告編集 → メインテキスト欄の「＋追加」→ 最大5つのバリエーションを入力 → Metaが自動最適化' },
    ],
  },
  {
    id: 'imp_7',
    icon: 'trending',
    category: '予算配分',
    severity: 'low',
    title: 'キャンペーン4の費用対効果を検証',
    detail: 'キャンペーン4のCPA ¥3,635はキャンペーン1（CPA ¥7,228）よりは良好だが、LTVとの比較検証が必要。',
    action: 'CV後の購入転換率を確認し、LTVベースでCPA目標を再設定',
    howTo: [
      { method: 'カスタムコンバージョンで追跡', steps: '広告マネージャ →「イベントマネージャ」→「カスタムコンバージョン」→ CV後の購入イベントを設定' },
    ],
  },
];

const iconMap: Record<string, React.ReactNode> = {
  creative: <Zap size={18} />,
  target: <Target size={18} />,
  clock: <Clock size={18} />,
  users: <Users size={18} />,
  trending: <TrendingDown size={18} />,
  device: <Sparkles size={18} />,
};

const severityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const severityLabels: Record<string, string> = {
  high: '重要度：高',
  medium: '重要度：中',
  low: '重要度：低',
};

const STORAGE_KEY = 'ad-analyzer-improvement-status';

export default function AIAdvicePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [aiImprovements, setAiImprovements] = useState<Improvement[]>(improvements);
  const [aiSummary, setAiSummary] = useState<string>('全体のCPAは¥128で大幅改善されましたが、これは特定日（3/6-3/7）の大量CVによる影響が大きく、通常日のCPAは¥3,000〜¥7,000台と高止まりしています。クリック率0.74%は業界平均を下回っており、クリエイティブの訴求力向上とターゲティングの精度改善が急務です。');
  const [overallScore, setOverallScore] = useState(defaultOverallScore);
  const [aiError, setAiError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // localStorageから復元
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setStatuses(JSON.parse(saved));
        return;
      }
    } catch {}
    const init: Record<string, Status> = {};
    aiImprovements.forEach(imp => { init[imp.id] = '未対応'; });
    setStatuses(init);
  }, []);

  // unmount時に進行中の生成を中止
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // AI分析を実行
  const generateAIAdvice = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true);
    setAiError(null);
    try {
      const adData = {
        accountSummary: mockAccountSummary,
        campaigns: mockCampaignData,
        daily: mockDailyData.slice(-14),
        weekday: mockWeekdayData,
        hourly: mockHourlyData.filter((_, i) => i % 3 === 0),
        device: mockDeviceData,
        gender: mockGenderData,
        age: mockAgeData,
        creatives: mockAdCreatives.map(a => ({ name: a.adName, impressions: a.impressions, clicks: a.clicks, ctr: a.ctr, cpc: a.cpc, spend: a.spend, conversions: a.conversions, cvr: a.cvr, cpa: a.cpa })),
      };

      const res = await fetch(apiUrl('/api/ai'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: adData }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'AI分析に失敗しました');
      }

      const result = await res.json();

      // サマリー更新
      if (result.summary?.content) {
        setAiSummary(result.summary.content);
      }

      // 改善案を更新
      if (result.findings && result.findings.length > 0) {
        const iconOptions = ['creative', 'target', 'clock', 'users', 'trending'];
        const newImprovements: Improvement[] = result.findings.map((f: any, i: number) => ({
          id: `ai_${i}`,
          icon: iconOptions[i % iconOptions.length],
          category: f.category || 'その他',
          severity: f.severity || 'medium',
          title: f.title || '',
          detail: f.detail || '',
          action: f.action || '',
          howTo: result.actionPlan?.[i]?.howTo || [{ method: '広告マネージャで設定', steps: f.action }],
        }));
        setAiImprovements(newImprovements);

        // ステータス初期化
        const init: Record<string, Status> = {};
        newImprovements.forEach(imp => { init[imp.id] = '未対応'; });
        setStatuses(init);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      }

      // スコア更新（findingsの重要度から算出）
      if (result.findings) {
        const highCount = result.findings.filter((f: any) => f.severity === 'high').length;
        const total = result.findings.length;
        const score = Math.max(1, Math.min(5, 5 - (highCount / total) * 3));
        setOverallScore(Math.round(score * 10) / 10);
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setAiError((e as Error).message);
    } finally {
      if (!controller.signal.aborted) setIsGenerating(false);
    }
  };

  const updateStatus = (id: string, status: Status) => {
    const next = { ...statuses, [id]: status };
    setStatuses(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const toggleOpen = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredImprovements = filter === 'all'
    ? aiImprovements
    : aiImprovements.filter(imp => statuses[imp.id] === filter);

  const statusCounts = {
    all: aiImprovements.length,
    '未対応': aiImprovements.filter(imp => statuses[imp.id] === '未対応').length,
    '対応済み': aiImprovements.filter(imp => statuses[imp.id] === '対応済み').length,
    '却下': aiImprovements.filter(imp => statuses[imp.id] === '却下').length,
  };

  return (
    <div>
      <PageHeader title="改善スコアリング" subtitle="広告運用の最適化レベルを評価し、具体的な改善案を提示します" />

      {/* Generate Button */}
      <div className="mb-6">
        <button
          onClick={generateAIAdvice}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isGenerating ? 'AI分析中...（20〜30秒かかります）' : 'AIアドバイスを再生成'}
        </button>
        {aiError && (
          <p className="text-xs text-danger mt-2">{aiError}</p>
        )}
      </div>

      {/* ===== 全体スコア ===== */}
      <div className="bg-card-bg rounded-xl border border-border p-6 mb-6">
        <div className="flex items-start gap-8">
          {/* 総合スコア */}
          <div className="text-center flex-shrink-0">
            <p className="text-xs text-muted font-medium mb-2">広告運用 最適化レベル</p>
            <div className="text-5xl font-bold text-primary mb-2">{overallScore.toFixed(1)}</div>
            <StarRating score={overallScore} size={24} showScore={false} />
            <p className="text-xs text-muted mt-2">5段階評価</p>
          </div>

          {/* カテゴリ別スコア */}
          <div className="flex-1 grid grid-cols-5 gap-3">
            {categoryScores.map((cat, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted font-medium mb-1">{cat.label}</p>
                <div className="text-xl font-bold mb-1">{cat.score.toFixed(1)}</div>
                <StarRating score={cat.score} size={12} showScore={false} />
                <p className="text-[10px] text-muted mt-1.5 leading-tight">{cat.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== サマリー ===== */}
      <div className="bg-card-bg rounded-xl border border-border p-6 mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
          <span className="text-2xl">📊</span>
          分析サマリー
        </h3>
        <p className="text-sm leading-relaxed text-foreground/80">
          {aiSummary}
        </p>
      </div>

      {/* ===== 改善案一覧 ===== */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            改善案一覧
          </h3>
        </div>

        {/* フィルタ */}
        <div className="flex items-center gap-2 mb-4">
          <Filter size={14} className="text-muted" />
          {(['all', '未対応', '対応済み', '却下'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                filter === f
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-border hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'すべて' : f}
              <span className="ml-1 opacity-70">({statusCounts[f]})</span>
            </button>
          ))}
        </div>

        {/* 改善案リスト */}
        <div className="space-y-3">
          {filteredImprovements.map(imp => {
            const currentStatus = statuses[imp.id] || '未対応';
            const isOpen = openIds.has(imp.id);

            const isRejected = currentStatus === '却下';

            return (
              <div key={imp.id} className={`rounded-xl border overflow-hidden transition-all ${isRejected ? 'bg-gray-100 border-gray-200 opacity-50' : 'bg-card-bg border-border'}`}>
                {/* ヘッダー */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isRejected ? 'bg-gray-200 text-gray-400' : 'bg-primary/10 text-primary'}`}>
                      {iconMap[imp.icon]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-xs text-muted font-medium">{imp.category}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${severityColors[imp.severity]}`}>
                          {severityLabels[imp.severity]}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-2">{imp.title}</h4>
                      <p className="text-sm text-foreground/70 mb-3">{imp.detail}</p>
                      <div className="bg-primary/5 rounded-lg px-4 py-3 border border-primary/10 mb-3">
                        <p className="text-sm font-medium text-primary">
                          💡 推奨アクション: {imp.action}
                        </p>
                      </div>

                      {/* ステータス + 手順展開 */}
                      <div className="flex items-center gap-3">
                        {/* ステータスボタン */}
                        {(['未対応', '対応済み', '却下'] as Status[]).map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(imp.id, s)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                              currentStatus === s
                                ? `${statusConfig[s].bg} ${statusConfig[s].text} border-current`
                                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {s}
                          </button>
                        ))}

                        <div className="flex-1" />

                        {/* 手順展開ボタン */}
                        <button
                          onClick={() => toggleOpen(imp.id)}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          {isOpen ? '手順を閉じる' : '設定手順を見る'}
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 手順（展開時） */}
                {isOpen && (
                  <div className="px-5 pb-5 ml-14 space-y-2">
                    {imp.howTo.map((how, hIdx) => (
                      <div key={hIdx} className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-100">
                        <p className="text-xs font-semibold text-blue-800 mb-1.5">{how.method}</p>
                        <p className="text-sm text-blue-900 leading-relaxed">{how.steps}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filteredImprovements.length === 0 && (
            <div className="text-center py-12 text-muted text-sm">
              「{filter}」の改善案はありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
