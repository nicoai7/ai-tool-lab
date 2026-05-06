# Email Tool (Gmail簡単管理ツール)

AIがGmailの受信メールを自動で要約・優先度分類。複数アカウントを1画面で一括管理。

- **デプロイ先**: https://email-tool-lime-kappa.vercel.app
- **対象ユーザー**: 個人 / 業務での Gmail ユーザー(LINE 連携なし、Google OAuth 単独)

---

## 主要機能

| 機能 | パス | 概要 |
|---|---|---|
| ログイン | `/` | Google OAuth でログイン |
| ダッシュボード | `/dashboard` | 受信メールの要約・優先度4分類・既読化 |
| アカウント追加 | `/api/accounts/add` | 別の Google アカウントを追加(同オーナー配下に登録) |

### 優先度4分類(AI が自動付与)

| 優先度 | バッジ | 例 |
|---|---|---|
| 🔴 即対応 (urgent) | 赤 | 金額・契約・クレーム・期限付き |
| 🟡 今日中 (today) | 黄 | 日程調整・質問・依頼 |
| 🔵 確認のみ (info) | 青 | レポート・情報共有 |
| ⚪ スキップ (skip) | 灰 | 営業・メルマガ・広告 |

---

## 技術スタック

| 種別 | 採用 |
|---|---|
| Framework | Next.js **16.2.1** (App Router) |
| Runtime | React 19.2.4 / TypeScript ^5 |
| Styling | Tailwind CSS v4 |
| 認証 | NextAuth **v5 beta** + Google OAuth Provider |
| Gmail | `googleapis` ^171 |
| AI | `@anthropic-ai/sdk` (`claude-sonnet-4-20250514`, `max_tokens: 4096`) |
| 永続化 | Supabase (`gmail_accounts` テーブル) |
| 状態管理 | React `useState` のみ(SWR / Zustand 不使用) |

---

## 認証 / データ保存先

### Google OAuth フロー

```
/                                ← 未ログインのランディング
ユーザーが「Googleアカウントでログイン」を押す
   ↓ NextAuth signIn("google", { redirectTo: "/dashboard" })
Google 認可ダイアログ
   scope: openid email profile gmail.readonly gmail.modify
   access_type: offline (refresh_token 取得)
   prompt: consent (毎回アカウント選択)
   ↓ コールバック
/api/auth/callback/google
   ├ NextAuth jwt callback
   │   ├ token に { accessToken, refreshToken, expiresAt, ownerEmail, activeGmailEmail } を格納
   │   └ upsertGmailAccount() → Supabase gmail_accounts に保存
   └ 暗号化 JWT を Cookie に保存(NextAuth デフォルト)
```

### データ保存先(2箇所)

#### (1) NextAuth JWT Cookie(`AUTH_SECRET` で暗号化)

- `accessToken / refreshToken / expiresAt / ownerEmail / activeGmailEmail`
- 「最後にログインしたアカウント」のトークンが上書きされる
- セッション戦略: **JWT**(adapter 未設定 = DB セッションテーブルなし)

#### (2) Supabase テーブル `gmail_accounts`(マルチアカウント永続化)

| カラム | 内容 |
|---|---|
| `id` (UUID) | 主キー |
| `user_email` | オーナーのメール(初回ログイン者) |
| `gmail_email` | 実際の Gmail アドレス |
| `account_name` | 表示名 |
| `access_token` | **平文**(暗号化なし) |
| `refresh_token` | **平文** |
| `expires_at` | UNIX秒 |
| `created_at / updated_at` | タイムスタンプ |
| **UNIQUE** | `(user_email, gmail_email)` |

> **アプリ層暗号化なし**。Supabase の at-rest 暗号化のみ。

### マルチアカウント設計

- 同じ `user_email`(オーナー)の下に複数 `gmail_email` 行を持てる
- ダッシュボードでチェックボックスで複数選択 → `/api/emails/all` で同時取得
- メール本文は **DB に保存しない**(毎回 Gmail API から取得)
- AI 分析結果も **保存しない**(毎リクエストで Anthropic を呼ぶ)

---

## API ルート一覧

| メソッド・パス | 役割 |
|---|---|
| `GET/POST /api/auth/[...nextauth]` | NextAuth ハンドラ(signin/callback/signout 内包) |
| `GET /api/accounts` | 登録済み Gmail アカウント一覧(トークン非露出) |
| `DELETE /api/accounts` | アカウント削除(⚠ 所有権チェックなし、IDOR 脆弱性) |
| `GET /api/accounts/add` | OAuth 再フローで別アカウント追加 |
| `GET /api/emails?accountId=...` | 単一アカウントのメール取得 + AI分析 |
| `GET /api/emails/all?accountIds=...` | 複数アカウント横断取得 + AI分析 |
| `GET /api/emails/[id]?accountId=...` | メール詳細(本文/添付メタ) |
| `POST /api/emails/mark-read` | 既読化(`gmail.modify` で `UNREAD` ラベル削除) |

---

## セットアップ

### 1. Google Cloud の準備

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. Gmail API を有効化
3. OAuth 同意画面を設定し、以下のスコープを追加
   - `openid` / `email` / `profile`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
4. OAuth 2.0 クライアントID 作成、**Authorized redirect URIs** に
   - `${AUTH_URL}/api/auth/callback/google` を登録
5. Client ID と Client Secret を取得

### 2. Supabase の準備

1. プロジェクト作成、URL と service_role_key を取得
2. `gmail_accounts` テーブルを作成(コードから推定する DDL):
   ```sql
   CREATE TABLE gmail_accounts (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_email    TEXT NOT NULL,
     gmail_email   TEXT NOT NULL,
     account_name  TEXT,
     access_token  TEXT NOT NULL,
     refresh_token TEXT,
     expires_at    BIGINT,
     created_at    TIMESTAMPTZ DEFAULT now(),
     updated_at    TIMESTAMPTZ DEFAULT now(),
     UNIQUE (user_email, gmail_email)
   );
   ```

### 3. 環境変数(`.env.local`)

| キー | 必須 | 用途 |
|---|:---:|---|
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | ✅ | 同上 |
| `AUTH_SECRET` | ✅ | NextAuth v5 の JWT 暗号化鍵 |
| `AUTH_URL` (or `NEXTAUTH_URL`) | 推奨 | 本番 URL(コールバックの base) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **高機密** RLS バイパス用 |
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

1. **`DELETE /api/accounts` に所有権チェックなし** — 任意のログインユーザーが他人の `gmail_accounts.id` で削除可能(IDOR)
2. **トークン平文保存** — `access_token` / `refresh_token` がアプリ層暗号化なしで Supabase に保存
3. **CSRF トークンなし** — `POST /api/emails/mark-read` 等は SameSite=Lax Cookie 依存のみ

### Gmail API への配慮不足

4. **ページネーション未実装** — `maxResults: 50` で打ち切り、`nextPageToken` を見ない
5. **メール本文を先頭500文字で切り詰め** — AI 精度に影響
6. **逐次 `messages.get` 呼出** — 並列化なし、レート制限・レイテンシ悪化
7. **指数バックオフ・リトライなし**

### NextAuth / トークン管理

8. **JWT 経路の期限切れ未対応** — `accountId` 未指定時のリフレッシュロジックなし
9. **`expires_at` がリフレッシュ時に更新されない** — 毎リクエストで「期限切れ」判定 → 無駄なリフレッシュが発生
10. **`refreshAccessToken` の重複実装** — `resolve-token.ts` と `emails/all/route.ts` で同じロジックがコピー
11. **マルチアカウントの最終ログイントークン上書き問題** — `accountId` 未指定の `/api/emails` は最後にログインした Gmail を使う

### AI 分析

12. **プロンプトキャッシュ未使用** — Anthropic の `cache_control` 未設定。共通指示部の 90% コスト削減余地
13. **AI 分析結果のキャッシュなし** — 同じメールでも毎回課金
14. **layout.tsx のメタデータが create-next-app テンプレ初期値**(`title: "Create Next App"`)

---

## ユーザー向けマニュアル

[`manual.md`](./manual.md) に詳細(同内容が `manual.txt` にもあり)。章立て:

1. 初回セットアップ
2. ログイン
3. ダッシュボードの見方
4. メールを分析する
5. メール一覧の操作
6. メールの詳細を見る
7. 複数アカウントの管理
8. よくあるエラーと対処法
9. Tips・活用法

---

## ドキュメント

- 詳細スキャン結果: 親リポの [`README.md`](../README.md) と [`ARCHITECTURE.md`](../ARCHITECTURE.md)

---

## 備考

- README はもともと create-next-app テンプレのままだったため本ドキュメントで全面書き換え
- LINE 認証ハブとの連携は **無し**(本ツールのみ独立した Google OAuth 認証)
