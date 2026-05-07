"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { withBasePath } from "@/lib/paths";

interface EmailDetail {
  id: string;
  from: string;
  to: string;
  cc: string;
  subject: string;
  date: string;
  textBody: string;
  htmlBody: string;
  attachments: { filename: string; mimeType: string; size: number }[];
}

interface AnalyzedEmail {
  id: string;
  from: string;
  subject: string;
  date: string;
  isUnread: boolean;
  summary: string;
  priority: "urgent" | "today" | "info" | "skip";
  priorityLabel: string;
  priorityEmoji: string;
  accountEmail?: string;
  accountId?: string;
}

interface EmailResponse {
  emails: AnalyzedEmail[];
  counts: {
    total: number;
    urgent: number;
    today: number;
    info: number;
    skip: number;
  };
}

const priorityConfig = {
  urgent: {
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    label: "🔴 即対応",
  },
  today: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
    label: "🟡 今日中",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    label: "🔵 確認のみ",
  },
  skip: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    badge: "bg-slate-100 text-slate-500",
    label: "⚪ スキップ可",
  },
};

type FilterMode = "hours" | "since" | "date";

export function EmailDashboard({ selectedAccountIds }: { selectedAccountIds: string[] }) {
  const [data, setData] = useState<EmailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState(false);
  const [readTab, setReadTab] = useState<"all" | "unread" | "read">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "urgent" | "today" | "info" | "skip">("all");
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<EmailDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewEmailId, setPreviewEmailId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("hours");
  const [hours, setHours] = useState(24);
  const [sinceDate, setSinceDate] = useState("");
  const [sinceTime, setSinceTime] = useState("09:00");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // アカウント切り替え時にリセット
  const accountKey = useMemo(() => [...selectedAccountIds].sort().join(","), [selectedAccountIds]);
  useEffect(() => {
    setData(null);
    setPreview(null);
    setPreviewEmailId(null);
    setHandledIds(new Set());
  }, [accountKey]);

  // 連打レース対策：直近のリクエストだけが反映されるようにする
  const fetchAbortRef = useRef<AbortController | null>(null);

  const fetchEmails = async () => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterMode === "hours") {
        params.set("hours", String(hours));
      } else if (filterMode === "since") {
        if (sinceDate) params.set("since", `${sinceDate}T${sinceTime}`);
      } else {
        if (dateFrom) params.set("from", dateFrom);
        if (dateTo) params.set("to", dateTo);
      }
      if (selectedAccountIds.length === 0) {
        throw new Error("アカウントが選択されていません");
      }
      const isMultiple = selectedAccountIds.length !== 1;
      if (isMultiple) {
        params.set("accountIds", selectedAccountIds.join(","));
      } else {
        params.set("accountId", selectedAccountIds[0]);
      }
      const endpoint = isMultiple ? "/api/emails/all" : "/api/emails";
      const res = await fetch(`${withBasePath(endpoint)}?${params}`, { signal: controller.signal });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "エラーが発生しました");
      }
      const result = await res.json();
      // 古いリクエストの結果は捨てる
      if (controller.signal.aborted) return;
      setData(result);
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // 上書きされただけ
      setError((e as Error).message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const toggleHandled = (id: string) => {
    setHandledIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const markAsRead = async (ids: string[]) => {
    if (ids.length === 0) {
      alert("未読メールはありません");
      return;
    }
    if (!data) return;

    // accountId ごとにグルーピング（複数アカウント時は別 token を使うため必須）
    const groups = new Map<string, string[]>();
    for (const id of ids) {
      const email = data.emails.find((e) => e.id === id);
      const accountId = email?.accountId || (selectedAccountIds.length === 1 ? selectedAccountIds[0] : undefined);
      if (!accountId) continue;
      const arr = groups.get(accountId) ?? [];
      arr.push(id);
      groups.set(accountId, arr);
    }
    if (groups.size === 0) {
      alert("対象アカウントを特定できませんでした");
      return;
    }

    setMarkingRead(true);
    try {
      const responses = await Promise.all(
        Array.from(groups.entries()).map(async ([accountId, messageIds]) => {
          const res = await fetch(withBasePath("/api/emails/mark-read"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageIds, accountId }),
          });
          return { accountId, res, messageIds };
        }),
      );

      const failedIds = new Set<string>();
      for (const { res, messageIds } of responses) {
        if (!res.ok) {
          messageIds.forEach((id) => failedIds.add(id));
          continue;
        }
        const json = (await res.json().catch(() => ({}))) as { failedIds?: string[] };
        (json.failedIds ?? []).forEach((id) => failedIds.add(id));
      }

      // 楽観的更新：成功した ID は isUnread=false にして UI を即同期
      const successIds = ids.filter((id) => !failedIds.has(id));
      setData((prev) =>
        prev
          ? {
              ...prev,
              emails: prev.emails.map((e) =>
                successIds.includes(e.id) ? { ...e, isUnread: false } : e,
              ),
            }
          : prev,
      );

      if (failedIds.size === 0) {
        alert(`${successIds.length}通を既読にしました`);
      } else {
        alert(`${successIds.length}通成功 / ${failedIds.size}通失敗`);
      }
    } catch {
      alert("既読処理に失敗しました");
    } finally {
      setMarkingRead(false);
    }
  };

  const openPreview = async (emailId: string) => {
    setPreviewEmailId(emailId);
    setPreviewLoading(true);
    setPreview(null);
    try {
      // メールに紐づくaccountIdを使う。各メールに accountId が付与されている前提（API 側で付与済み）
      let previewAccountId: string | null = null;
      if (data) {
        const email = data.emails.find((e) => e.id === emailId);
        previewAccountId = email?.accountId ?? null;
      }
      if (!previewAccountId && selectedAccountIds.length === 1) {
        previewAccountId = selectedAccountIds[0];
      }
      if (!previewAccountId) {
        setPreviewEmailId(null);
        return;
      }
      const params = new URLSearchParams({ accountId: previewAccountId });
      const res = await fetch(`${withBasePath(`/api/emails/${emailId}`)}?${params}`);
      if (res.ok) {
        const detail = await res.json();
        setPreview(detail);
      } else {
        setPreviewEmailId(null);
      }
    } catch {
      setPreviewEmailId(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreview(null);
    setPreviewEmailId(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return dateStr;
    }
  };

  const formatFrom = (from: string) => {
    const match = from.match(/^"?([^"<]+)"?\s*</);
    return match ? match[1].trim() : from.split("@")[0];
  };

  // クライアントマウント後に「今日」と現在日付見出しを計算する。Cache Components 下では
  // Client Component 内の `new Date()` 直接参照が prerender エラーを起こすため、初期値は空文字。
  const [today, setToday] = useState("");
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
    const now = new Date();
    setToday(now.toISOString().split("T")[0]);
    setDateStr(`${now.getMonth() + 1}/${now.getDate()}`);
  }, []);

  const filterUI = (
    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
      {/* タブ切り替え */}
      <div className="mb-4 flex rounded-lg bg-slate-100 p-1">
        {(["hours", "since", "date"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`flex-1 rounded-md px-2 py-2 text-sm font-medium transition ${
              filterMode === mode
                ? "bg-white text-[#1a73e8] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {mode === "hours" ? "直近◯時間" : mode === "since" ? "◯日◯時〜今" : "期間指定"}
          </button>
        ))}
      </div>

      {filterMode === "hours" && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#5f6368]">直近</span>
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
          >
            <option value={1}>1時間</option>
            <option value={3}>3時間</option>
            <option value={6}>6時間</option>
            <option value={12}>12時間</option>
            <option value={24}>24時間</option>
            <option value={48}>48時間</option>
            <option value={72}>3日間</option>
            <option value={168}>1週間</option>
          </select>
          <span className="text-sm text-[#5f6368]">のメールを分析</span>
        </div>
      )}

      {filterMode === "since" && (
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={sinceDate}
            max={today}
            onChange={(e) => setSinceDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
          />
          <input
            type="time"
            value={sinceTime}
            onChange={(e) => setSinceTime(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
          />
          <span className="text-sm text-[#5f6368]">〜 現在</span>
        </div>
      )}

      {filterMode === "date" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <label className="w-12 text-sm text-[#5f6368]">From</label>
            <input
              type="date"
              value={dateFrom}
              max={today}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="w-12 text-sm text-[#5f6368]">To</label>
            <input
              type="date"
              value={dateTo}
              max={today}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:ring-1 focus:ring-[#1a73e8]"
            />
          </div>
        </div>
      )}
    </div>
  );

  // 初期状態：分析ボタン表示
  if (!data && !loading) {
    return (
      <div className="flex flex-col items-center gap-6 py-16">
        <div className="text-6xl">📬</div>
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold text-[#202124]">
            メールを分析する
          </h2>
          <p className="text-sm text-[#5f6368]">
            直近◯時間の受信メールをAIが自動で要約・分類します
          </p>
        </div>
        {filterUI}
        <button
          onClick={fetchEmails}
          className="rounded-full bg-[#1a73e8] px-8 py-3.5 text-base font-medium text-white shadow-sm transition hover:bg-[#1765cc] hover:shadow-md"
        >
          分析を開始する
        </button>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }

  // ローディング中
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
        <p className="text-sm text-slate-500">
          メールを分析中...（30件程度で30秒ほどかかります）
        </p>
      </div>
    );
  }

  if (!data) return null;

  // 既読/未読フィルター
  const readFiltered = data.emails.filter((e) => {
    if (readTab === "unread") return e.isUnread;
    if (readTab === "read") return !e.isUnread;
    return true;
  });

  // 優先度フィルター
  const filtered = readFiltered.filter((e) => {
    if (priorityFilter === "all") return true;
    return e.priority === priorityFilter;
  });

  // カウント（現在の既読/未読タブに基づく）
  const tabCounts = {
    total: readFiltered.length,
    urgent: readFiltered.filter((e) => e.priority === "urgent").length,
    today: readFiltered.filter((e) => e.priority === "today").length,
    info: readFiltered.filter((e) => e.priority === "info").length,
    skip: readFiltered.filter((e) => e.priority === "skip").length,
  };

  // 未読タブの一括既読用
  const unreadIdsInView = filtered.filter((e) => e.isUnread).map((e) => e.id);

  return (
    <div>
      {/* サマリーヘッダー */}
      <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#202124]">
            📧 メール概要　{dateStr}
          </h2>
          <button
            onClick={() => setData(null)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-[#5f6368] transition hover:bg-slate-100"
          >
            🔄 条件を変えて再分析
          </button>
        </div>

        {/* 全て / 未読 / 既読 タブ */}
        <div className="mb-4 flex rounded-lg bg-slate-100 p-1">
          {([
            { key: "all", label: `全て (${data.counts.total})` },
            { key: "unread", label: `未読 (${data.emails.filter((e) => e.isUnread).length})` },
            { key: "read", label: `既読 (${data.emails.filter((e) => !e.isUnread).length})` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setReadTab(key); setPriorityFilter("all"); }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                readTab === key
                  ? "bg-white text-[#1a73e8] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 優先度カウント＆フィルターボタン */}
        <div className="flex flex-wrap gap-2 text-sm">
          {([
            { key: "all", label: `全${tabCounts.total}通`, style: "bg-slate-100 text-slate-700" },
            { key: "urgent", label: `🔴 即対応 ${tabCounts.urgent}通`, style: "bg-red-100 text-red-700" },
            { key: "today", label: `🟡 今日中 ${tabCounts.today}通`, style: "bg-yellow-100 text-yellow-700" },
            { key: "info", label: `🔵 確認のみ ${tabCounts.info}通`, style: "bg-blue-100 text-blue-700" },
            { key: "skip", label: `⚪ スキップ ${tabCounts.skip}通`, style: "bg-slate-100 text-slate-500" },
          ] as const).map(({ key, label, style }) => (
            <button
              key={key}
              onClick={() => setPriorityFilter(key)}
              className={`rounded-full px-3 py-1 transition ${style} ${
                priorityFilter === key
                  ? "ring-2 ring-[#1a73e8] ring-offset-1"
                  : "hover:opacity-80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 未読タブ：一括既読ボタン */}
        {readTab === "unread" && unreadIdsInView.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <button
              onClick={() => markAsRead(unreadIdsInView)}
              disabled={markingRead}
              className="rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1765cc] disabled:opacity-50"
            >
              {markingRead
                ? "処理中..."
                : `表示中の${unreadIdsInView.length}通を一括既読にする`}
            </button>
          </div>
        )}
      </div>

      {/* 2カラム：左メール一覧 / 右プレビュー */}
      <div className="flex gap-4" style={{ minHeight: "calc(100vh - 280px)" }}>
        {/* 左カラム：メール一覧 */}
        <div className={`shrink-0 space-y-1.5 overflow-y-auto ${previewEmailId ? "w-[380px]" : "w-full"}`}>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              該当するメールはありません
            </p>
          )}
          {filtered.map((email) => {
            const config = priorityConfig[email.priority];
            const isHandled = handledIds.has(email.id);
            const isSkip = email.priority === "skip";
            const isSelected = previewEmailId === email.id;
            return (
              <div
                key={email.id}
                onClick={() => {
                  if (!isSkip) openPreview(email.id);
                }}
                className={`rounded-lg border p-3 transition ${
                  isSelected
                    ? "border-[#1a73e8] bg-blue-50 ring-1 ring-[#1a73e8]"
                    : `${config.border} ${isHandled ? "bg-white opacity-60" : config.bg}`
                } ${isSkip ? "" : "cursor-pointer hover:shadow-sm"}`}
              >
                <div className="mb-1 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.badge}`}>
                      {config.label}
                    </span>
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {formatFrom(email.from)}
                    </span>
                    {email.isUnread && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#1a73e8]" />
                    )}
                    {selectedAccountIds.length > 1 && email.accountEmail && (
                      <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
                        {email.accountEmail.split("@")[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">
                      {formatDate(email.date)}
                    </span>
                    {!isSkip && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHandled(email.id);
                        }}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
                          isHandled
                            ? "border-green-300 bg-green-100 text-green-700"
                            : "border-slate-300 text-[#5f6368] hover:bg-slate-100"
                        }`}
                      >
                        {isHandled ? "✓ 済" : "対応済み"}
                      </button>
                    )}
                  </div>
                </div>
                <p className="truncate text-sm font-medium text-slate-800">
                  {email.subject}
                </p>
                {!previewEmailId && (
                  <p className="truncate text-sm text-slate-500">→ {email.summary}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* 右カラム：プレビューペイン */}
        {previewEmailId && (
          <div className="flex min-w-0 flex-1 flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
            {/* プレビューヘッダー */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="truncate text-sm font-bold text-[#202124]">
                {previewLoading ? "読み込み中..." : preview?.subject}
              </h3>
              <div className="flex shrink-0 items-center gap-2">
                {preview && (
                  <a
                    href={`https://mail.google.com/mail/u/0/#inbox/${preview.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-[#1a73e8] transition hover:bg-slate-50"
                  >
                    Gmailで開く ↗
                  </a>
                )}
                <button
                  onClick={closePreview}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {previewLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#1a73e8]" />
              </div>
            ) : preview ? (
              <>
                {/* メタ情報 */}
                <div className="shrink-0 border-b border-slate-100 px-5 py-3 text-xs text-[#5f6368]">
                  <div className="mb-0.5">
                    <span className="font-medium text-[#202124]">From:</span> {preview.from}
                  </div>
                  <div className="mb-0.5">
                    <span className="font-medium text-[#202124]">To:</span> {preview.to}
                  </div>
                  {preview.cc && (
                    <div className="mb-0.5">
                      <span className="font-medium text-[#202124]">Cc:</span> {preview.cc}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-[#202124]">Date:</span> {preview.date}
                  </div>
                  {preview.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {preview.attachments.map((att, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                        >
                          📎 {att.filename} ({Math.round(att.size / 1024)}KB)
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 本文 */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {preview.htmlBody ? (
                    <iframe
                      srcDoc={preview.htmlBody}
                      className="h-full min-h-[400px] w-full border-0"
                      sandbox="allow-same-origin"
                      title="メール本文"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[#202124]">
                      {preview.textBody || "(本文なし)"}
                    </pre>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
