import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCampaignInsights, getAdInsights } from '@/lib/meta-api';

async function callAnthropic(apiKey: string, prompt: string, maxTokens = 8192): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Anthropic API error: ${JSON.stringify(error)}`);
  }

  const result = await res.json();
  return result.content[0].text;
}

function buildAnalysisPrompt(context: string): string {
  const today = new Date().toISOString().split('T')[0];

  return `あなたは広告マーケティングの競合分析エキスパートです。

${context}

## タスク
1. この業種で**実際にMeta広告（Facebook/Instagram）を配信している実在の企業・ブランド**を10社特定してください
2. 各企業について、実際に配信していると考えられる広告の分析を行ってください
3. 企業名は必ず**実在する企業・ブランド名**を使ってください（架空の企業名は禁止）

## 出力形式
以下のJSON配列を出力してください。JSONのみ、他のテキストは不要です。
今日の日付は${today}です。

[
  {
    "id": "comp_1",
    "advertiser": "実在する企業・ブランド名",
    "adTitle": "その企業が実際に使っていそうな広告見出し",
    "platforms": ["Facebook", "Instagram"],
    "startDate": "YYYY-MM-DD（推定配信開始日）",
    "daysRunning": 数値,
    "variations": 数値（1-15）,
    "scaleScore": 数値（0-30）,
    "freshnessScore": 数値（0-20）,
    "buzzScore": 数値（0-25）,
    "creativeScore": 数値（0-25）,
    "totalScore": 数値（上記4つの合計、0-100）,
    "creativeAnalysis": "この企業の広告戦略の分析（2-3文）",
    "appealTriggers": ["訴求トリガー1", "訴求トリガー2", "訴求トリガー3", "訴求トリガー4"],
    "suggestion": "この競合から学べる自社への改善提案（1-2文）",
    "scaleDetail": {
      "period": "XX日間配信中",
      "platformCount": 数値,
      "variationCount": 数値
    },
    "freshnessDetail": {
      "startDate": "YYYY-MM-DD",
      "daysAgo": 数値,
      "recency": "配信開始からの期間の説明"
    },
    "buzzDetail": {
      "snsMentions": 数値（推定SNS言及数）,
      "searchTrend": "急上昇" or "上昇トレンド" or "横ばい",
      "trendScore": "高" or "中" or "低"
    },
    "creativeDetail": {
      "format": "画像" or "動画" or "カルーセル" or "Reels" etc,
      "copyStrength": "高（理由）" or "中（理由）" or "低（理由）",
      "visualImpact": "高（特徴）" or "中" or "低",
      "ctaClarity": "明確（ボタン種類）" or "不明確"
    },
    "adLibraryUrl": "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=JP&q=企業名をURLエンコード&search_type=keyword_unordered&media_type=all",
    "websiteUrl": "企業の公式サイトURL（わかる場合）"
  }
]

重要：
- **必ず実在する企業・ブランド名を使ってください**。架空の企業名は絶対に使わないでください
- 日本のMeta広告でアクティブに広告を配信している企業を選んでください
- adLibraryUrlは各企業の広告主名でMeta広告ライブラリを検索するURLを正確に生成してください
- websiteUrlは企業の公式サイトURLを記載してください（不明な場合は空文字）
- 各スコアはtotalScoreが40-95の範囲に分散するようにしてください
- totalScoreはscaleScore + freshnessScore + buzzScore + creativeScoreの正確な合計にしてください`;
}

// GET: 広告アカウントから自動で競合分析
export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('meta_access_token')?.value;
  const accountId = cookieStore.get('meta_ad_account_id')?.value;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!accessToken || !accountId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const params = {
      accessToken, accountId,
      startDate: sixtyDaysAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };

    const [campaigns, ads] = await Promise.all([
      getCampaignInsights(params),
      getAdInsights(params),
    ]);

    const campaignNames = campaigns.map((c: any) => c.campaign_name).filter(Boolean);
    const adNames = ads.map((a: any) => a.ad_name).filter(Boolean);
    const adsetNames = [...new Set(ads.map((a: any) => a.adset_name).filter(Boolean))];

    const context = `以下はあるMeta広告アカウントで配信中のキャンペーン名・広告名です。この情報から業種・ジャンルを特定し、その業種の競合を分析してください。

## キャンペーン名
${campaignNames.join('\n')}

## 広告セット名
${adsetNames.join('\n')}

## 広告名
${adNames.join('\n')}`;

    const prompt = buildAnalysisPrompt(context);
    const text = await callAnthropic(apiKey, prompt);

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Failed to parse AI response');

    const competitors = JSON.parse(match[0]);
    return NextResponse.json({ data: competitors });
  } catch (err: any) {
    console.error('Competitors API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate competitor analysis' }, { status: 500 });
  }
}

// POST: 手動入力による競合分析
export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { genre, description } = await request.json();
    if (!genre && !description) {
      return NextResponse.json({ error: 'ジャンルまたはサービス内容を入力してください' }, { status: 400 });
    }

    const context = `以下の業種・ジャンルの競合を分析してください。

業種・ジャンル: ${genre || '未指定'}
サービス内容・補足: ${description || '未指定'}`;

    const prompt = buildAnalysisPrompt(context);
    const text = await callAnthropic(apiKey, prompt);

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Failed to parse AI response');

    const competitors = JSON.parse(match[0]);
    return NextResponse.json({ data: competitors });
  } catch (err: any) {
    console.error('Competitors API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate competitor analysis' }, { status: 500 });
  }
}
