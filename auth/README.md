# AIツールラボ 認証基盤

公式LINE「AIツールラボ」の **友だち登録者だけ** に、3つの無料AIツールへのアクセスを提供するハブサイト。

- **認証**: LINE Login (OAuth 2.0)
- **ゲート判定**: LINE Messaging API の friendship status（公式アカウントの友だちか）
- **セッション**: HS256 JWT を HTTP-only Cookie に格納（30日）
- **課金**: なし（友だち登録による無料アクセス）

> 実装詳細は [`OVERVIEW.md`](./OVERVIEW.md)、アーキテクチャ図は [`ARCHITECTURE.md`](./ARCHITECTURE.md) を参照してください。

---

## 構成

| 機能 | パス | 認証 |
|---|---|:---:|
| ランディング | `GET /` | 公開 |
| ログイン | `GET /login` | 公開 |
| 友だち未登録ガイド | `GET /not-friend` | 公開 |
| OAuth開始 | `GET /api/auth/line` | 公開 |
| OAuthコールバック | `GET /auth/callback/line` | 公開 |
| ログアウト | `POST /api/logout` | 公開 |
| ダッシュボード（3ツール一覧） | `GET /dashboard` | 要セッション |
| アカウント設定 | `GET /account` | 要セッション |

ルート保護は Next.js 16 の **proxy（旧 middleware）** `proxy.ts` で行い、`/dashboard` `/account` を保護対象としています。

---

## 技術スタック

| 種別 | 採用 |
|---|---|
| Framework | Next.js **16.2.4**（App Router） |
| Runtime | React 19.2.4 |
| Language | TypeScript ^5（`strict: true`） |
| Styling | Tailwind CSS v4（`@tailwindcss/postcss`） |
| JWT | `jose` ^6（state / session 共に HS256） |
| Lint | ESLint 9 flat config |
| Dev port | **3003** |

> Next.js 16 はミドルウェア機構が破壊的変更されており、`middleware.ts` ではなく `proxy.ts`、関数名も `middleware` ではなく `proxy` を export します（`AGENTS.md` の警告どおり）。

---

## セットアップ手順

### 1. LINE Developers の準備

1. [LINE Developers Console](https://developers.line.biz/) でプロバイダーを作成（または既存を使用）
2. **同じプロバイダー配下** に以下を作成
   - **LINEログインチャネル**（OAuth 用）
   - **Messaging APIチャネル**（公式アカウント・friendship 判定用）
   > friendship status API は同一プロバイダー内のチャネルでのみ機能します
3. LINEログインチャネル → 「LINEログイン設定」
   - **Callback URL** に `${NEXT_PUBLIC_SITE_URL}/auth/callback/line` を登録
     - 例 開発: `http://localhost:3003/auth/callback/line`
     - 例 本番: `https://ai-tool-lab.net/auth/callback/line`
   - スコープ: `profile` と `openid` を有効化
4. 公式LINEアカウントの **Basic ID**（`@xxxx`）をメモ

### 2. 環境変数

`.env.example` をコピーして値を埋めます。

```bash
cp .env.example .env.local
```

| キー | 必須 | 取得元 / 用途 |
|---|:---:|---|
| `LINE_LOGIN_CHANNEL_ID` | ✅ | LINE Developers → LINEログインチャネル → Channel ID |
| `LINE_LOGIN_CHANNEL_SECRET` | ✅ | 同上 → Channel secret |
| `SESSION_SECRET` | ✅ | state JWT と session JWT の署名鍵。48バイト以上推奨 |
| `NEXT_PUBLIC_SITE_URL` | 推奨 | 例 `http://localhost:3003` / 本番 `https://ai-tool-lab.net` |
| `NEXT_PUBLIC_LINE_OA_BASIC_ID` | 任意 | 公式LINE Basic ID（`@xxxx`）。未設定時はコード内の既定値 |
| `TOOL_API_SECRET` | 任意 | 各ツールから本サイトのAPIを叩く際の検証用（現状未使用） |

`SESSION_SECRET` の生成例:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> `SESSION_SECRET` を変更すると、既存セッション Cookie はすべて無効化されます。

### 3. 開発サーバー起動

```bash
npm install
npm run dev
```

[http://localhost:3003](http://localhost:3003) でアクセスできます。

### 4. ビルド・本番起動

```bash
npm run build
npm run start
```

### 5. Lint

```bash
npm run lint
```

---

## 認証フロー（概要）

```
[/]──CTA──▶ [/login] ──▶ GET /api/auth/line
                              └─ signState() で state を JWT 化（10分TTL）
                              └─ LINE 認可画面へ 302
                                       │
                                       ▼ (ユーザー承認)
                          GET /auth/callback/line?code=...&state=...
                              ├─ verifyState で改竄/期限切れ検証
                              ├─ exchangeCodeForToken → access_token
                              ├─ fetchProfile → { userId, displayName, pictureUrl }
                              └─ checkFriendship(access_token)
                                   ├─ false → /not-friend?name=...
                                   └─ true  → セッションCookie発行 → /dashboard
```

セキュリティ要点:

- `state` は **JWT 化（cookie レス）** で LINE アプリ内ブラウザの Cookie 不安定問題を回避
- コールバックの `redirect` パスは **`/` 始まりのみ許可** してオープンリダイレクトを防止
- `/dashboard` は表示のたびに `checkFriendship` を再実行し、ブロック解除や友だち削除に追従
- Cookie: `httpOnly` / `sameSite=lax` / `secure`（本番のみ）/ `maxAge` 30日

詳細は [`OVERVIEW.md`](./OVERVIEW.md) を参照。

---

## 提供ツール

ダッシュボードからリンクされる外部ツール（別ドメインの Vercel デプロイ）:

| ツール | URL | マニュアル |
|---|---|---|
| Meta広告分析改善ツール | https://ad-analyzer-ten.vercel.app/ai-advice | `public/manuals/Meta広告分析改善ツール_使い方マニュアル.pdf` |
| SEO分析改善・記事作成ツール | https://seo-improve-tool.vercel.app | `public/manuals/SEO分析改善・記事作成ツール_使い方マニュアル.pdf` |
| Gmail簡単管理ツール | https://email-tool-lime-kappa.vercel.app | `public/manuals/Gmail簡単管理ツール_使い方マニュアル.pdf` |

---

## デプロイ（Vercel 想定）

1. GitHub にプッシュ
2. Vercel でインポート
3. 環境変数を設定（`.env.example` の必須項目すべて）
4. 独自ドメインを接続
5. **LINE Developers の Callback URL を本番ドメインに更新**:
   `https://<本番ドメイン>/auth/callback/line`
6. `NEXT_PUBLIC_SITE_URL` を本番URLに更新

---

## 今後の拡張候補

- パスワードリセット機能（現状 LINE 認証のみ）
- 利用規約・プライバシーポリシー・特定商取引法表記のページ
- 各ツール側からの契約状態確認エンドポイント（`TOOL_API_SECRET` を活用）
- 法人プラン・有料プラン追加（現状無料のみ）

---

## ライセンス・備考

- 本リポジトリは内部利用想定。LINE のロゴ・ブランドガイドラインに従って利用してください。
- `AGENTS.md` に記載のとおり、Next.js 16 の新仕様を前提としています。古い Next.js の知識（`middleware.ts` 等）で書き換えないでください。
