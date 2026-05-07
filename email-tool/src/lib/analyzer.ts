import Anthropic from "@anthropic-ai/sdk";
import { RawEmail } from "./gmail";

export interface AnalyzedEmail {
  id: string;
  from: string;
  subject: string;
  date: string;
  isUnread: boolean;
  summary: string;
  priority: "urgent" | "today" | "info" | "skip";
  priorityLabel: string;
  priorityEmoji: string;
}

const client = new Anthropic();
const MODEL = "claude-sonnet-4-5";

// 優先度の定型プロンプトは system に置き、prompt caching で高速＆低コスト化。
const SYSTEM_PROMPT = `あなたはメール優先度判定アシスタントです。与えられたメール一覧を分析し、各メールの「要約」と「優先度」をJSON配列で返します。

## 優先度の基準
- "urgent": 即対応が必要（金額・契約・クレーム・期限付き・上司/重要取引先から）
- "today": 今日中に返信が必要だが緊急ではない（日程調整・質問・依頼）
- "info": 確認のみ（返信不要・情報共有・レポート）
- "skip": スキップ可（営業メール・メルマガ・自動通知・広告）

## 出力形式（JSONのみ、マークダウンや説明は禁止）
[
  {"index": 0, "summary": "1-2行の日本語要約", "priority": "urgent|today|info|skip"}
]`;

const PRIORITY_MAP: Record<
  string,
  { label: string; emoji: string; key: AnalyzedEmail["priority"] }
> = {
  urgent: { label: "即対応", emoji: "🔴", key: "urgent" },
  today: { label: "今日中", emoji: "🟡", key: "today" },
  info: { label: "確認のみ", emoji: "🔵", key: "info" },
  skip: { label: "スキップ可", emoji: "⚪", key: "skip" },
};

function fallbackInfo(email: RawEmail): AnalyzedEmail {
  const p = PRIORITY_MAP.info;
  return {
    id: email.id,
    from: email.from,
    subject: email.subject,
    date: email.date,
    isUnread: email.isUnread,
    summary: email.subject,
    priority: p.key,
    priorityLabel: p.label,
    priorityEmoji: p.emoji,
  };
}

export async function analyzeEmails(emails: RawEmail[]): Promise<AnalyzedEmail[]> {
  if (emails.length === 0) return [];

  const emailList = emails
    .map(
      (e, i) =>
        `--- メール${i + 1} ---\nFrom: ${e.from}\nSubject: ${e.subject}\nDate: ${e.date}\nBody: ${e.body}\n`,
    )
    .join("\n");

  let text = "";
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `以下のメール一覧を上記基準で分析してください。\n\n${emailList}`,
        },
      ],
    });
    text = response.content[0]?.type === "text" ? response.content[0].text : "";
  } catch (e) {
    // API 失敗時は info フォールバックで全件返す。メール一覧自体が見えなくならないようにする。
    console.error("Anthropic 呼び出し失敗:", (e as Error).message);
    return emails.map(fallbackInfo);
  }

  let results: { index: number; summary: string; priority: string }[];
  try {
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    results = JSON.parse(cleaned);
    if (!Array.isArray(results)) throw new Error("not an array");
  } catch {
    return emails.map(fallbackInfo);
  }

  return emails.map((email, i) => {
    const result = results.find((r) => r.index === i);
    const p = PRIORITY_MAP[result?.priority ?? "info"] ?? PRIORITY_MAP.info;
    return {
      id: email.id,
      from: email.from,
      subject: email.subject,
      date: email.date,
      isUnread: email.isUnread,
      summary: result?.summary || email.subject,
      priority: p.key,
      priorityLabel: p.label,
      priorityEmoji: p.emoji,
    };
  });
}
