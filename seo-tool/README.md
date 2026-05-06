# SEO Tool (SEO分析改善・記事作成ツール)

キーワードからSEO記事を自動生成。既存記事のスコア分析・リライト・サイト総合診断も実施可能。

- **デプロイ先**: https://seo-improve-tool.vercel.app
- **対象ユーザー**: AIツールラボ公式LINEの友だち登録者

---

## 主要機能

| 機能 | パス | 概要 |
|---|---|---|
| ダッシュボード | `/dashboard` | 統計サマリ + クイックアクション |
| 記事作成 | `/dashboard/create` | キーワード → 競合分析 → 構成案 → SEO記事生成(5ステップウィザード) |
| 記事改善 | `/dashboard/improve` | 既存記事URLから SEO スコア + 改善提案 + リライト |
| SEO診断 | `/dashboard/audit` | URLのテクニカルSEO診断(チェック項目 + improvement_report) |
| 履歴 | `/dashboard/history` | articles / audits の一覧表示 + 一括削除 |
| 記事詳細 | `/dashboard/articles/[id]` | 個別記事のタイトル/メタ/本文/改善提案を表示 |
| 設定 | `/dashboard/settings` | サイト名・業種・ターゲット・トーンなど7項目 |

---

## 技術スタック

| 種別 | 採用 |
|---|---|
| Framework | Next.js **16.2.1** (App Router) |
| Runtime | React 19.2.4 / TypeScript ^5 |
| Styling | Tailwind CSS v4 |
| AI | `@anthropic-ai/sdk` (`claude-sonnet-4-6`) |
| AI Tools | Anthropic **web_search** ツール(競合分析で使用、`max_uses: 5`) |
| 認証 | LINE Login (OAuth 2.0) + 公式アカウント友だち判定 |
| JWT | `jose` ^6 (HS256) |
| 永続化 | Supabase (`articles` / `audits` / `seo_settings`) |
| アイコン | lucide-react |

---

## 認証 / データ保存先

### LINE OAuth フロー(authリポと同パターン)

```
/login → /api/auth/line(state Cookie 発行)
       → LINE 認可
       → /auth/callback/line
            ├ verify state(line_oauth_state Cookie)
            ├ exchangeCodeForToken
            ├ fetchProfile
            ├ checkFriendship
            └ JWT セッション(`ai_tool_lab_session` Cookie, 30日, HS256)
```

> セッション JWT のペイロードに **LINE access_token を平文で内包**(httpOnly Cookie)。

### Supabase スキーマ(`migration-line-auth.sql` 実行済み前提)

| テーブル | カラム | 用途 |
|---|---|---|
| `articles` | `id, user_id(text=LINE userId), mode('create'\|'improve'), title, meta_description, body_markdown, target_keyword, source_url, seo_score, suggestions, created_at` | 生成記事 / 改善前後の記事 |
| `audits` | `id, user_id, target_url, overall_score, checks(JSON), improvement_report, created_at` | テクニカルSEO診断結果 |
| `seo_settings` | `user_id(PK), site_name, site_type, industry, target_audience, tone, default_char_count, updated_at` | ユーザーごとのサイト情報 |

> **RLS は無効**。すべて `service_role_key` の admin client で書き、認可はアプリ層(`user_id = session.sub`)で実施。

### sessionStorage(クライアント側一時保存)

- `improve_result` — 記事改善ページのリロード復元
- `audit_result` — SEO診断ページのリロード復元

---

## API ルート一覧

| メソッド・パス | 役割 |
|---|---|
| `GET /api/auth/line` | LINE OAuth 開始 |
| `GET /auth/callback/line` | OAuth コールバック → セッション発行 |
| `POST /api/logout` | セッション Cookie 削除 |
| `GET /api/me` | 現在のユーザー(認証済みなら `{userId, name, picture}`) |
| `POST /api/seo` | SEO 機能の統合エンドポイント |

### `POST /api/seo` の `action` 種別

| action | 入力 | 処理 | 保存先 |
|---|---|---|---|
| `create-analyze` | `{keyword}` | Claude + web_search で競合分析 → 構成案 | レスポンスのみ |
| `create-article` | `{keyword, outlines}` | Claude(max_tokens=16384)で記事生成 | `articles`(`mode='create'`) |
| `improve-analyze` | `{url}` | URLを fetch → HTML 解析 → Claude にSEO分析依頼 | `articles`(`mode='improve'`) |
| `improve-rewrite` | `{article_id}` | 既存記事 + 提案を Claude にリライト依頼 | `articles` を update |
| `audit` | `{url}` | URLを fetch → Claude にテクニカルSEO診断依頼 | `audits` |

> Vercel Functions タイムアウト `maxDuration = 120` 秒(`/api/seo`)。

---

## ルート保護(`src/middleware.ts`)

```
公開: / /login /not-friend/* /api/auth/line/* /auth/callback/line/* /api/logout/*
保護: 上記以外すべて(api/me, api/seo, /dashboard/*)

未認証 + 保護 → /login?redirect=<元のpath>
認証済み + /login → /dashboard
```

> `auth` リポと違いミドルウェアファイル名は **`src/middleware.ts`** で `export function middleware`(Next.js 16 通常版)。

---

## セットアップ

### 1. LINE Developers の準備

`auth` リポの README と同手順:
- LINE Login チャネル作成、Callback URL に `${NEXT_PUBLIC_SITE_URL}/auth/callback/line`
- 公式LINEと **同一プロバイダー** 配下に置くこと(friendship status API 要件)

### 2. Supabase の準備

1. プロジェクト作成、URL と service_role_key を取得
2. SQL Editor で `supabase/migration-line-auth.sql` を実行
3. `articles` `audits` `seo_settings` のテーブルが `user_id text` 型になり RLS 無効になる

### 3. 環境変数(`.env.local`)

| キー | 必須 | 用途 |
|---|:---:|---|
| `LINE_LOGIN_CHANNEL_ID` | ✅ | LINE Login Channel ID |
| `LINE_LOGIN_CHANNEL_SECRET` | ✅ | LINE Login Channel Secret |
| `SESSION_SECRET` | ✅ | JWT(HS256)署名鍵。48バイト以上推奨 |
| `NEXT_PUBLIC_SITE_URL` | 推奨 | 例 `http://localhost:3000` |
| `NEXT_PUBLIC_LINE_OA_BASIC_ID` | 任意 | 公式LINE Basic ID(未設定時はコード内の既定値) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key(現状未使用に近い) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **高機密**。RLSバイパス用 |
| `ANTHROPIC_API_KEY` | ✅ | Claude API キー |

### 4. 起動

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
```

---

## ⚠ 既知の問題

### セキュリティ

1. **`fetchUrlContent(url)` に SSRF 対策なし** — `improve-analyze` / `audit` は任意URLを叩けるため、`http://169.254.169.254/`(クラウドメタデータ)等を fetch される可能性
2. **エラーレスポンスに `dbError.message` が透過** — DBスキーマ詳細が漏れる
3. **`/api/seo` にレート制限なし** — 認証済みユーザーが乱打すると Anthropic 課金が青天井
4. **RLS 無効化済み + service_role 直叩き** — `user_id` フィルタ漏れがあると即横展開
5. **LINE access_token を JWT ペイロードに平文** — 署名のみ、デコードで参照可能(httpOnly Cookie で XSS 経由は限定)

### Anthropic Claude `web_search` ツール

- `as any` キャストで型を回避(`route.ts:52`)
- SDK 更新時に挙動が変わる可能性

---

## ドキュメント

- 詳細スキャン結果: 親リポの [`README.md`](../README.md) と [`ARCHITECTURE.md`](../ARCHITECTURE.md)
- DB マイグレーション: [`supabase/migration-line-auth.sql`](./supabase/migration-line-auth.sql)

---

## 備考

- README はもともと create-next-app テンプレのままだったため本ドキュメントで全面書き換え
- リポジトリ名は元 `SEO-` だが、親フォルダ統合時に `seo-tool` に改名
