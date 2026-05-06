import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { data } = await request.json();

    const prompt = `あなたはMeta広告（Facebook/Instagram/Threads）の運用改善コンサルタントです。
以下の広告パフォーマンスデータを分析し、具体的で実行可能な改善アドバイスを日本語で提供してください。

## 分析データ
${JSON.stringify(data, null, 2)}

## 出力形式
以下のJSON形式で出力してください：
{
  "summary": {
    "title": "分析サマリー",
    "content": "全体の概要（2-3文）"
  },
  "findings": [
    {
      "category": "カテゴリ名（クリエイティブ/ターゲット/時間帯/性別/曜日/デバイスなど）",
      "severity": "high/medium/low",
      "title": "発見のタイトル",
      "detail": "詳細説明（具体的な数値を含む）",
      "action": "推奨アクション"
    }
  ],
  "actionPlan": [
    {
      "priority": 1,
      "action": "具体的なアクション",
      "impact": "高/中/低"
    }
  ]
}

重要な注意点：
- 必ず具体的な数値を引用して分析してください
- CPAが高い広告の停止、予算の再配分、ターゲティングの調整など実行可能なアドバイスを優先してください
- severity: highは即座に対応すべき項目、mediumは1週間以内、lowは余裕があれば対応
- findingsは5-7個、actionPlanは5-8個を目安にしてください`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`Anthropic API error: ${JSON.stringify(error)}`);
    }

    const result = await res.json();
    const text = result.content[0].text;

    // JSON部分を抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON');
    }

    const advice = JSON.parse(jsonMatch[0]);
    return NextResponse.json(advice);
  } catch (err: any) {
    console.error('AI advice error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate AI advice' },
      { status: 500 }
    );
  }
}
