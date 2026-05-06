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

export async function analyzeEmails(
  emails: RawEmail[]
): Promise<AnalyzedEmail[]> {
  if (emails.length === 0) return [];

  const emailList = emails
    .map(
      (e, i) =>
        `--- メール${i + 1} ---\nFrom: ${e.from}\nSubject: ${e.subject}\nDate: ${e.date}\nBody: ${e.body}\n`
    )
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `以下のメール一覧を分析し、各メールの「要約」と「優先度」をJSON配列で返してください。

## 優先度の基準
- "urgent": 即対応が必要（金額・契約・クレーム・期限付き・上司/重要取引先から）
- "today": 今日中に返信が必要だが緊急ではない（日程調整・質問・依頼）
- "info": 確認のみ（返信不要・情報共有・レポート）
- "skip": スキップ可（営業メール・メルマガ・自動通知・広告）

## 出力形式
JSONの配列のみ返してください。マークダウンのコードブロックは不要です。
[
  {
    "index": 0,
    "summary": "1-2行の日本語要約",
    "priority": "urgent|today|info|skip"
  }
]

## メール一覧
${emailList}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  let results: { index: number; summary: string; priority: string }[];
  try {
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    results = JSON.parse(cleaned);
  } catch {
    // パース失敗時はデフォルト値で返す
    return emails.map((e) => ({
      ...e,
      summary: e.subject,
      priority: "info" as const,
      priorityLabel: "確認のみ",
      priorityEmoji: "🔵",
    }));
  }

  const priorityMap: Record<
    string,
    { label: string; emoji: string; key: AnalyzedEmail["priority"] }
  > = {
    urgent: { label: "即対応", emoji: "🔴", key: "urgent" },
    today: { label: "今日中", emoji: "🟡", key: "today" },
    info: { label: "確認のみ", emoji: "🔵", key: "info" },
    skip: { label: "スキップ可", emoji: "⚪", key: "skip" },
  };

  return emails.map((email, i) => {
    const result = results.find((r) => r.index === i);
    const p = priorityMap[result?.priority || "info"] || priorityMap.info;
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
