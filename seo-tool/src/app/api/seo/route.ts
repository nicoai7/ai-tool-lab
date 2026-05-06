import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/session'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 120

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.sub

  const supabase = createAdminClient()

  const body = await request.json()
  const { action } = body

  const { data: settings } = await supabase
    .from('seo_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (action === 'create-analyze') {
    return handleCreateAnalyze(supabase, userId, settings, body)
  } else if (action === 'create-article') {
    return handleCreateArticle(supabase, userId, settings, body)
  } else if (action === 'improve-analyze') {
    return handleImproveAnalyze(supabase, userId, settings, body)
  } else if (action === 'improve-rewrite') {
    return handleImproveRewrite(supabase, userId, body)
  } else if (action === 'audit') {
    return handleAudit(supabase, userId, body)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

async function callClaude(prompt: string, maxTokens: number = 8192) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = message.content.find((b: any) => b.type === 'text')
  return (textBlock as any)?.text || ''
}

async function callClaudeWithWebSearch(prompt: string, maxTokens: number = 8192) {
  const message = await (anthropic.messages.create as any)({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlocks = message.content.filter((b: any) => b.type === 'text')
  return textBlocks.map((b: any) => b.text).join('\n') || ''
}

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOTool/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    const html = await res.text()
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i)
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["']/i)
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["']/i)
    const viewportMatch = html.match(/<meta[^>]*name=["']viewport["']/i)
    const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || []
    const h2Matches = html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || []
    const h3Matches = html.match(/<h3[^>]*>(.*?)<\/h3>/gi) || []
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi) || []
    const imgWithoutAlt = (html.match(/<img(?![^>]*alt=["'][^"']+["'])[^>]*>/gi) || []).length
    const totalImg = (html.match(/<img[^>]*>/gi) || []).length
    const isHttps = url.startsWith('https')
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["'](.*?)["']/i)

    const meta = `
=== SEOメタ情報 ===
URL: ${url}
HTTPS: ${isHttps ? 'はい' : 'いいえ'}
title: ${titleMatch?.[1] || '未設定'}
meta description: ${descMatch?.[1] || '未設定'}
og:title: ${ogTitleMatch?.[1] || '未設定'}
og:description: ${ogDescMatch?.[1] || '未設定'}
viewport: ${viewportMatch ? 'あり' : 'なし'}
canonical: ${canonicalMatch?.[1] || '未設定'}
H1タグ数: ${h1Matches.length}
H1内容: ${h1Matches.map(h => h.replace(/<[^>]+>/g, '')).join(', ') || 'なし'}
H2タグ数: ${h2Matches.length}
H2内容: ${h2Matches.map(h => h.replace(/<[^>]+>/g, '')).join(', ') || 'なし'}
H3タグ数: ${h3Matches.length}
構造化データ(JSON-LD): ${jsonLdMatches.length > 0 ? `${jsonLdMatches.length}件あり` : 'なし'}
画像総数: ${totalImg}
alt属性なし画像: ${imgWithoutAlt}
=== 本文（先頭5000文字） ===
${text.slice(0, 5000)}
`
    return meta
  } catch (e: any) {
    return `URLの取得に失敗しました: ${e.message}`
  }
}

function parseJSON(result: string) {
  const startArr = result.indexOf('[')
  const endArr = result.lastIndexOf(']')
  const startObj = result.indexOf('{')
  const endObj = result.lastIndexOf('}')

  if (startArr !== -1 && endArr !== -1 && (startArr < startObj || startObj === -1)) {
    return JSON.parse(result.substring(startArr, endArr + 1))
  }
  if (startObj !== -1 && endObj !== -1) {
    return JSON.parse(result.substring(startObj, endObj + 1))
  }
  throw new Error('JSONが見つかりません')
}

function buildSettingsContext(settings: any): string {
  if (!settings) return ''
  return `
■ サイト情報
サイト名：${settings.site_name || '未設定'}
サイトの種類：${settings.site_type || '未設定'}
業種・ジャンル：${settings.industry || '未設定'}
ターゲット読者：${settings.target_audience || '未設定'}
文章のトーン：${settings.tone || '未設定'}

※ 上記のサイト情報を考慮して、このサイトのターゲット読者に最も効果的な提案をしてください。
※ 例えば企業HPなら信頼性・専門性を重視、個人ブログなら親しみやすさ・共感を重視するなど、サイトの種類に合わせた提案にすること。
`.trim()
}

async function handleCreateAnalyze(supabase: any, userId: string, settings: any, body: any) {
  const { keyword } = body
  if (!keyword) return NextResponse.json({ error: 'キーワードが必要です' }, { status: 400 })

  const settingsContext = buildSettingsContext(settings)

  const prompt = `あなたはSEOの専門家です。以下のキーワードで検索し、上位の競合記事を分析してください。

キーワード：「${keyword}」

${settingsContext}

以下を実行してください：
1. 「${keyword}」でWeb検索し、上位の競合記事を5〜8件分析
2. 各記事のタイトル、見出し構造（H2/H3）、推定文字数、強みを把握
3. 分析結果をもとに、SEOで上位表示できる構成案を提案

以下のJSON形式で出力してください。JSONのみ出力。説明文や\`\`\`は不要。

{"competitors":[{"url":"URL","title":"タイトル","headings":["H2: 見出し1","H3: 見出し1-1"],"word_count":3000,"strengths":"強み"}],"suggested_outline":[{"level":"h2","text":"見出しテキスト","target_words":500}]}`

  try {
    const result = await callClaudeWithWebSearch(prompt)
    const data = parseJSON(result)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: '競合分析に失敗しました: ' + error.message }, { status: 500 })
  }
}

async function handleCreateArticle(supabase: any, userId: string, settings: any, body: any) {
  const { keyword, outline } = body
  if (!keyword || !outline) return NextResponse.json({ error: 'キーワードと構成案が必要です' }, { status: 400 })

  const settingsContext = buildSettingsContext(settings)
  const outlineStr = outline.map((item: any) => `${item.level}: ${item.text}（目安${item.target_words}文字）`).join('\n')

  const prompt = `あなたはSEOライティングの専門家です。以下の構成案に基づいて、SEO最適化された記事を生成してください。

キーワード：「${keyword}」

${settingsContext}

■ 構成案
${outlineStr}

■ SEOルール（厳守）
- タイトルにキーワード「${keyword}」を含める（32文字以内が理想）
- H2/H3見出しにキーワードや関連語を自然に含める
- 冒頭300文字以内にキーワードを入れる
- 見出しは最低5つ
- キーワード密度2〜4%
- 共起語・関連語を散りばめる
- メタディスクリプションは120文字以内でキーワード含む

■ 出力形式
タイトル案を3つ、メタディスクリプション、本文（Markdown形式）、内部リンク提案を生成してください。

以下のJSON形式で出力してください。JSONのみ出力。説明文や\`\`\`は不要。

{"titles":["タイトル案1","タイトル案2","タイトル案3"],"meta_description":"メタディスクリプション","body_markdown":"# 記事タイトル\\n\\n本文...","internal_links":[{"anchor":"アンカーテキスト","path":"/suggested-path","reason":"リンク理由"}]}`

  try {
    const result = await callClaude(prompt, 16384)
    const data = parseJSON(result)

    const { data: article, error: dbError } = await supabase
      .from('articles')
      .insert({
        user_id: userId,
        mode: 'create',
        target_keyword: keyword,
        outline: outline,
        title: data.titles[0],
        meta_description: data.meta_description,
        body_markdown: data.body_markdown,
        internal_links: data.internal_links,
        status: 'completed',
      })
      .select('id')
      .single()

    if (dbError) {
      return NextResponse.json({ error: 'DB保存に失敗しました: ' + dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      article_id: article.id,
      titles: data.titles,
      meta_description: data.meta_description,
      body_markdown: data.body_markdown,
      internal_links: data.internal_links,
    })
  } catch (error: any) {
    return NextResponse.json({ error: '記事生成に失敗しました: ' + error.message }, { status: 500 })
  }
}

async function handleImproveAnalyze(supabase: any, userId: string, settings: any, body: any) {
  const { url } = body
  if (!url) return NextResponse.json({ error: 'URLが必要です' }, { status: 400 })

  const settingsContext = buildSettingsContext(settings)

  const pageContent = await fetchUrlContent(url)

  const prompt = `あなたはSEO分析の専門家です。以下のページ情報をSEO観点で詳細に分析してください。

${settingsContext}

${pageContent}

■ スコアリング基準（各0〜100点）
- title_score: キーワード含有、文字数（32文字前後が理想）、魅力度
- heading_score: H1の有無、H2/H3の構造、キーワード含有
- keyword_score: キーワード密度（2〜4%が理想）、共起語、配置
- meta_score: description有無、文字数（120文字以内が理想）、キーワード含有
- readability_score: 文の長さ、漢字比率、改行頻度

■ 出力形式
以下のJSON形式で出力してください。JSONのみ出力。説明文や\`\`\`は不要。

{"seo_score":{"overall":75,"title":80,"headings":70,"keywords":65,"meta":80,"readability":75},"suggestions":[{"category":"検索結果の説明文（meta description）","what_is":"検索結果の説明文とは：Googleで検索したときにタイトルの下に表示される短い説明文のこと。これが魅力的だとクリックされやすくなります。","issue":"問題点をわかりやすく","suggestion":"具体的な改善案","priority":"high"}],"original_content":{"title":"元タイトル","meta_description":"元メタディスクリプション","headings":["H1: ...","H2: ..."],"word_count":3000,"body_excerpt":"冒頭500文字..."}}

重要ルール：
- categoryは「日本語の説明（英語の専門用語）」の形式で書く。例：「検索結果の説明文（meta description）」「ページタイトル（title）」「見出し構造（headings）」「SNSシェア設定（OGP）」「検索エンジン向けの構造化情報（structured data）」「正規URL設定（canonical）」「画像の説明テキスト（alt属性）」
- what_is には「〇〇とは：」の形式で、その項目が何なのか・なぜ大事なのかを、Web制作の知識がない人でもわかるように1〜2文で解説する
- issue（問題点）とsuggestion（改善案）も、専門知識がない人が読んでも「何をすればいいか」がわかる日本語で書くこと
- ターゲット読者の情報がある場合は、その読者に響く改善案を提案すること`

  try {
    const result = await callClaude(prompt)
    const data = parseJSON(result)

    const { data: article, error: dbError } = await supabase
      .from('articles')
      .insert({
        user_id: userId,
        mode: 'improve',
        source_url: url,
        title: data.original_content?.title || '',
        meta_description: data.original_content?.meta_description || '',
        seo_score: data.seo_score,
        improvement_suggestions: data.suggestions,
        original_content: data.original_content,
        status: 'analyzed',
      })
      .select('id')
      .single()

    if (dbError) {
      return NextResponse.json({ error: 'DB保存に失敗しました: ' + dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      article_id: article.id,
      seo_score: data.seo_score,
      suggestions: data.suggestions,
      original_content: data.original_content,
    })
  } catch (error: any) {
    return NextResponse.json({ error: '記事分析に失敗しました: ' + error.message }, { status: 500 })
  }
}

async function handleImproveRewrite(supabase: any, userId: string, body: any) {
  const { article_id } = body
  if (!article_id) return NextResponse.json({ error: 'article_idが必要です' }, { status: 400 })

  const { data: article, error: fetchError } = await supabase
    .from('articles')
    .select('*')
    .eq('id', article_id)
    .eq('user_id', userId)
    .single()

  if (fetchError || !article) {
    return NextResponse.json({ error: '記事が見つかりません' }, { status: 404 })
  }

  const suggestionsStr = (article.improvement_suggestions || [])
    .map((s: any) => `[${s.priority}] ${s.category}: ${s.issue} → ${s.suggestion}`)
    .join('\n')

  const originalContent = article.original_content || {}

  const prompt = `あなたはSEOライティングの専門家です。以下の既存記事を改善提案に基づいてリライトしてください。

■ 元記事情報
タイトル：${originalContent.title || article.title || ''}
メタディスクリプション：${originalContent.meta_description || article.meta_description || ''}
見出し構造：${(originalContent.headings || []).join('\n')}
本文抜粋：${originalContent.body_excerpt || ''}

■ SEOスコア
${JSON.stringify(article.seo_score || {}, null, 2)}

■ 改善提案
${suggestionsStr}

■ SEOルール（厳守）
- タイトルにキーワードを含める（32文字以内が理想）
- H2/H3見出しにキーワードや関連語を自然に含める
- 冒頭300文字以内にキーワードを入れる
- 見出しは最低5つ
- キーワード密度2〜4%
- 共起語・関連語を散りばめる
- メタディスクリプションは120文字以内でキーワード含む

改善提案をすべて反映した修正版を生成してください。

以下のJSON形式で出力してください。JSONのみ出力。説明文や\`\`\`は不要。

{"title":"改善後タイトル","meta_description":"改善後メタディスクリプション","body_markdown":"# 改善後タイトル\\n\\n本文..."}`

  try {
    const result = await callClaude(prompt, 16384)
    const data = parseJSON(result)

    const { error: updateError } = await supabase
      .from('articles')
      .update({
        title: data.title,
        meta_description: data.meta_description,
        body_markdown: data.body_markdown,
        status: 'rewritten',
        updated_at: new Date().toISOString(),
      })
      .eq('id', article_id)
      .eq('user_id', userId)

    if (updateError) {
      return NextResponse.json({ error: 'DB更新に失敗しました: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      title: data.title,
      meta_description: data.meta_description,
      body_markdown: data.body_markdown,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'リライトに失敗しました: ' + error.message }, { status: 500 })
  }
}

async function handleAudit(supabase: any, userId: string, body: any) {
  const { url } = body
  if (!url) return NextResponse.json({ error: 'URLが必要です' }, { status: 400 })

  const pageContent = await fetchUrlContent(url)

  const prompt = `あなたはテクニカルSEOの専門家です。以下のページ情報をもとにテクニカルSEO診断を行ってください。

${pageContent}

■ チェック項目
1. メタタグ（title/description/OGP）の有無と品質
2. 見出し構造（H1重複、階層の正しさ）
3. SSL（httpsか）
4. モバイル対応（viewport meta）
5. 構造化データ（JSON-LD有無）
6. 画像alt属性の有無
7. canonical設定

各項目をpass/warn/failでスコアリングし、総合スコア(0-100)を算出してください。
改善指示書もMarkdown形式で生成してください。

以下のJSON形式で出力してください。JSONのみ出力。説明文や\`\`\`は不要。

{"overall_score":75,"checks":[{"category":"メタタグ（検索結果に表示される情報）","item":"ページタイトル（titleタグ）","what_is":"ページタイトルとは：ブラウザのタブや検索結果に表示されるページの名前。SEOで最も重要な要素の一つです。","status":"pass","detail":"32文字以内でキーワードを含んでいる","how_to_fix":""}],"improvement_report":"# SEO改善指示書\\n\\n※各項目について「何をすればいいか」を具体的に書いています。\\nわからない場合はWeb制作会社やエンジニアに共有してください。\\n\\n## 優先度：高\\n..."}

重要ルール：
- categoryとitemは日本語で書くこと。英語の専門用語は括弧内に補足する形式にする
- what_isに「〇〇とは：」の形式で、その項目が何なのか・なぜ大事なのかを1〜2文で平易に解説する
- detailとhow_to_fixも、Web制作の知識がない人が読んでも理解できる日本語で書くこと
- improvement_reportは、そのままWeb制作会社やエンジニアに共有できる品質で書くこと`

  try {
    const result = await callClaude(prompt)
    const data = parseJSON(result)

    const { data: audit, error: dbError } = await supabase
      .from('audits')
      .insert({
        user_id: userId,
        target_url: url,
        overall_score: data.overall_score,
        checks: data.checks,
        improvement_report: data.improvement_report,
        status: 'completed',
      })
      .select('id')
      .single()

    if (dbError) {
      return NextResponse.json({ error: 'DB保存に失敗しました: ' + dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      audit_id: audit.id,
      overall_score: data.overall_score,
      checks: data.checks,
      improvement_report: data.improvement_report,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'テクニカルSEO診断に失敗しました: ' + error.message }, { status: 500 })
  }
}
