# ai-tool-lab-auth — 実装オーバービュー

> このドキュメントは、リポジトリ全体を **実装ベース** で読み解くためのリファレンスです。
> リポジトリ既存の `README.md` は「Stripe + Supabase の月額サブスク」前提で書かれていますが、
> 現状のコードには **Stripe / Supabase は一切登場しません**。
> 実装は **LINE Login (OAuth 2.0) + LINE 公式アカウントの友だち判定** によるゲートサイトです。
> 既存 README は将来計画 / 旧仕様として残されているものと推測されます。

---

## 1. プロジェクトの実体

公式LINE「AIツールラボ」の **友だち登録者だけ** に、3つのAIツールへのアクセスを許可するハブサイト。

- ユーザーは LINE Login でサインイン
- LINE Messaging API の friendship status で「公式アカウントを友だち追加しているか」を確認
- 友だちなら `/dashboard` で 3ツール（外部 Vercel デプロイ）への入口とマニュアルPDFを提示
- 友だちでなければ `/not-friend` で友だち追加へ誘導

提供ツール（dashboard からのアウトバウンドリンク先）:

| ツール | URL |
|---|---|
| Meta広告分析改善ツール | `https://ad-analyzer-ten.vercel.app/ai-advice` |
| SEO分析改善・記事作成ツール | `https://seo-improve-tool.vercel.app` |
| Gmail簡単管理ツール | `https://email-tool-lime-kappa.vercel.app` |

各ツールには `public/manuals/<name>_使い方マニュアル.pdf` がダウンロードリンクとして紐づいています。

---

## 2. 技術スタック

| 種別 | 採用 |
|---|---|
| Framework | **Next.js 16.2.4** (App Router) |
| UI | React 19.2.4 / React DOM 19.2.4 |
| Language | TypeScript ^5 (`strict: true`, target ES2017, paths `@/*` → repo root) |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Auth (OAuth) | LINE Login v2.1（authorize / token / profile） |
| Auth (gating) | LINE Messaging API `friendship/v1/status` |
| JWT | `jose` ^6.2.2（HS256）— state と session の両方に使用 |
| Lint | ESLint 9 flat config (`eslint-config-next/core-web-vitals`, `/typescript`) |
| Dev port | **3003**（`next dev -p 3003`） |

> `AGENTS.md` に「This is NOT the Next.js you know」とあり、実際 Next.js 16 ではミドルウェアファイル名が `middleware.ts` → `proxy.ts`、エクスポート関数名も `middleware` → `proxy` に変わっています。本リポジトリの `proxy.ts` はその新仕様準拠です。

依存関係に **Stripe / Supabase / DB クライアント / テストランナーは存在しません** (`package.json` 確認済み)。

---

## 3. ディレクトリ構造

```
ai-tool-lab-auth/
├── app/
│   ├── layout.tsx                       # ルートレイアウト (Geist フォント, 日本語)
│   ├── page.tsx                         # / ランディング (公開)
│   ├── globals.css                      # Tailwind v4 + ブランドカラー変数
│   ├── login/
│   │   ├── page.tsx                     # /login (server, Suspense ラッパ)
│   │   └── login-form.tsx               # /login (client, ?error / ?redirect 解析)
│   ├── dashboard/page.tsx               # /dashboard (要認証, 友だち再確認)
│   ├── account/page.tsx                 # /account (要認証, プロフィール表示)
│   ├── not-friend/page.tsx              # /not-friend (友だち追加誘導)
│   ├── api/
│   │   ├── auth/line/route.ts           # GET  /api/auth/line       OAuth開始
│   │   └── logout/route.ts              # POST /api/logout          Cookie削除
│   └── auth/callback/line/route.ts      # GET  /auth/callback/line  OAuthコールバック
├── lib/
│   ├── line/
│   │   ├── auth.ts                      # LINE OAuth ユーティリティ
│   │   └── friendship.ts                # 友だち判定 + 追加URL生成
│   └── session.ts                       # セッションJWT + Cookie管理
├── proxy.ts                             # Next.js 16 のミドルウェア (旧 middleware.ts)
├── public/
│   └── manuals/                         # 各ツールの使い方PDF
├── next.config.ts                       # 既定 (空)
├── eslint.config.mjs                    # flat config
├── tsconfig.json
├── package.json                         # next 16.2.4 / react 19.2.4 / jose 6
├── .env.example                         # 後述「環境変数」と同内容
├── README.md                            # ⚠ 旧仕様 (Stripe+Supabase前提)
├── AGENTS.md                            # Next.js 16 破壊的変更の警告
└── CLAUDE.md                            # AGENTS.md を参照
```

---

## 4. 認証フロー

```
[/]──「LINEでログイン」──▶ [/login]
                              │  ?redirect=<元ページ> ?error=<errkey>
                              │  「LINEでログイン」 (緑 #06C755) リンク
                              ▼
                  GET /api/auth/line?redirect=...
                    1. signState(redirectPath)        ← jose HS256 / TTL 10分
                    2. buildAuthorizeUrl(state)
                    3. 302 → access.line.me/oauth2/v2.1/authorize
                              │
                              ▼ (ユーザー承認 or キャンセル)
                  GET /auth/callback/line?code=...&state=...
                    ├─ ?error            →  /login?error=access_denied
                    ├─ code/state 欠落  →  /login?error=missing_params
                    ├─ verifyState NG  →  /login?error=state_mismatch
                    ├─ exchangeCodeForToken(code)        → access_token
                    ├─ fetchProfile(access_token)        → { userId, displayName, pictureUrl }
                    └─ checkFriendship(access_token)
                          │
                          ├── false → 302 /not-friend?name=<displayName>
                          │            └ 友だち追加URL + QR + 再ログイン導線
                          │
                          └── true  → signSession({ sub, name, picture, accessToken })
                                      Cookie `ai_tool_lab_session` を Set
                                        httpOnly / sameSite=lax / secure(本番) / 30日
                                      302 → redirectPath (先頭 "/" のみ許可) または /dashboard

[/dashboard]   getSession() ないと /login?redirect=/dashboard へ
               毎回 checkFriendship() で再判定 → false なら /not-friend
               OK なら 3ツールカード (外部リンク + マニュアルPDF) を表示

[/account]     getSession() ないと /login?redirect=/account へ
               LINEプロフィール (picture/name/sub) + 公式LINE Basic ID 表示
               「ログアウト」 = POST /api/logout → Cookie 削除 → / へ 303
```

### セキュリティ上の要点

- **state は JWT 化（cookie レス）**: `lib/line/auth.ts` のコメントに `// stateをJWTで署名（cookie不要・stateless）。LINEアプリ内ブラウザでcookie送信が不安定な問題に対応。` と明記。state 改竄や有効期限切れは `verifyState` が `null` を返す。
- **オープンリダイレクト対策**: コールバックの `redirectPath` は **`'/'` で始まる場合のみ採用**、それ以外は `/dashboard` へフォールバック。
- **友だち再確認**: `dashboard` ページは表示のたびに `checkFriendship` を呼び、ブロック解除や友だち削除の取りこぼしを防ぐ。`account` ページでは呼ばない（プロフィール表示のみ）。
- **Cookie 属性**: `httpOnly: true`, `sameSite: 'lax'`, `secure: NODE_ENV === 'production'`, `path: '/'`, `maxAge: 30日`。
- **LINE access token はセッション JWT に内包** されて Cookie で運ばれる。`checkFriendship` を再実行する都合上、後段でも必要なため。

---

## 5. ページ・ルートの仕様

### Public

| パス | 種別 | 役割 |
|---|---|---|
| `/` | Server Page | ランディング。「LINEでログイン」CTA → `/login` |
| `/login` | Server + Client | 認可開始リンクを生成。`?error=` 表示 / `?redirect=` をクエリで保持 |
| `/not-friend` | Server Page (`force-dynamic`) | 友だち追加ボタン (`getAddFriendUrl()`) と QR (`https://qr-official.line.me/sid/M/<basicId>.png`) を表示 |

### Auth flow endpoints

| メソッド・パス | 処理 |
|---|---|
| `GET /api/auth/line` | `signState(redirectPath)` → `buildAuthorizeUrl(state)` → 302 |
| `GET /auth/callback/line` | error/欠落/state検証/トークン交換/プロフ取得/友だち判定/セッション発行 |
| `POST /api/logout` | `cookies.delete(SESSION_COOKIE)` → 303 → `NEXT_PUBLIC_SITE_URL`/ |

### Protected (要セッション)

| パス | 役割 |
|---|---|
| `/dashboard` | 友だち再確認後、3ツールカード（外部リンク + マニュアルPDF）を表示 |
| `/account` | LINEプロフィール（写真・名前・userId）と公式LINE basicId を表示。ログアウトボタンあり |

### `/login` のエラーキー → 表示文言

```
missing_params  : ログイン情報が不完全です。もう一度お試しください。
state_mismatch  : セキュリティエラーが発生しました。もう一度お試しください。
callback_failed : ログイン処理に失敗しました。時間を置いて再度お試しください。
access_denied   : ログインがキャンセルされました。
（その他）       : ログインエラーが発生しました。
```

---

## 6. `lib/` ユーティリティ

### `lib/line/auth.ts`

LINE Login OAuth 2.0 一式。

| 関数 | シグネチャ | 役割 |
|---|---|---|
| `getChannelId()` | `() => string` | `LINE_LOGIN_CHANNEL_ID` 取得（未設定で throw） |
| `getChannelSecret()` | `() => string` | `LINE_LOGIN_CHANNEL_SECRET` 取得（未設定で throw） |
| `getRedirectUri()` | `() => string` | `${NEXT_PUBLIC_SITE_URL}/auth/callback/line`（未設定時 `localhost:3003` フォールバック） |
| `signState(redirectPath?)` | HS256 JWT 発行 | `state` を 10分TTLで署名（payload `p` に redirectPath） |
| `verifyState(state)` | `{ redirectPath? } \| null` | 失敗は全て `null` を返す |
| `buildAuthorizeUrl(state)` | `string` | `https://access.line.me/oauth2/v2.1/authorize?...&scope=profile openid` |
| `exchangeCodeForToken(code)` | `Promise<TokenResponse>` | `https://api.line.me/oauth2/v2.1/token` へ form-urlencoded POST |
| `fetchProfile(accessToken)` | `Promise<LineProfile>` | `https://api.line.me/v2/profile` を Bearer で叩く |

### `lib/line/friendship.ts`

| 関数 | 役割 |
|---|---|
| `checkFriendship(accessToken)` | `https://api.line.me/friendship/v1/status` を叩き `friendFlag` を返す。非2xx は `false` 扱い（=未登録扱いで再ログイン） |
| `getAddFriendUrl()` | `https://line.me/R/ti/p/%40<basicId-without-@>` を生成 |
| `getBasicId()` | `NEXT_PUBLIC_LINE_OA_BASIC_ID`（未設定時 `'@972lxiol'`） |

### `lib/session.ts`

| 識別子 | 内容 |
|---|---|
| `SESSION_COOKIE` | `'ai_tool_lab_session'` |
| `LineSession` 型 | `{ sub, name, picture?, accessToken }` |
| `signSession(payload)` | HS256 JWT、`exp` 30日 |
| `verifySessionToken(token)` | 検証失敗時 `null` |
| `getSession()` | サーバー側 `cookies()` から読み出し → 検証 |
| `setSessionCookie(token)` / `clearSessionCookie()` | 同期API |

---

## 7. ルート保護（`proxy.ts`）

Next.js 16 の **proxy（旧 middleware）**。

```ts
const PROTECTED_PATHS = ['/dashboard', '/account']

matcher: ['/((?!_next/static|_next/image|favicon.ico|api|auth/callback).*)']
```

- 保護対象: `/dashboard/*`, `/account/*` — 未認証は `/login?redirect=<pathname>` へ
- 既ログインで `/login` を踏むと `/dashboard` へ自動遷移
- 除外: `_next/static`, `_next/image`, `favicon.ico`, `api/*`, `auth/callback/*`
- 認証判定は `jose.jwtVerify` のみで `SESSION_SECRET` 未設定時は **全アクセス未認証扱い**

---

## 8. 環境変数

`.env.example` をコピーして `.env.local` を作成してください。

| キー | 必須 | 公開 | 用途 / 取得元 |
|---|:---:|:---:|---|
| `LINE_LOGIN_CHANNEL_ID` | ✅ | server | LINE Developers → LINEログインチャネル → Channel ID |
| `LINE_LOGIN_CHANNEL_SECRET` | ✅ | server | 同上 → Channel secret |
| `SESSION_SECRET` | ✅ | server | state JWT と session JWT の HS256 署名鍵。48バイト以上推奨。生成例: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `NEXT_PUBLIC_SITE_URL` | 推奨 | public | 例 `http://localhost:3003` / `https://ai-tool-lab.net`。OAuth redirect_uri と logout 後の遷移先に使用 |
| `NEXT_PUBLIC_LINE_OA_BASIC_ID` | 任意 | public | 公式LINE Basic ID（`@xxxx`）。未設定時はコード内の既定値にフォールバック |
| `TOOL_API_SECRET` | 任意 | server | `.env.example` には記載があるが、現状の `app/` `lib/` `proxy.ts` では未参照。各AIツール側でこのリポジトリの API を叩く際の検証用想定 |
| `NODE_ENV` | 暗黙 | server | `production` のとき Cookie に `secure: true` を付ける（Next.js が自動設定） |

---

## 9. セットアップ・起動

```bash
# 1. 依存インストール
npm install

# 2. 環境変数を用意
cp .env.example .env.local
# 上記の必須キーを埋める

# 3. 開発サーバー (port 3003)
npm run dev

# 4. ビルド / 本番起動
npm run build
npm run start

# 5. Lint
npm run lint
```

LINE Developers 側の設定:

1. LINE Login チャネルを作成し、Channel ID / Channel secret を取得
2. **Callback URL** に `${NEXT_PUBLIC_SITE_URL}/auth/callback/line` を登録（例: `http://localhost:3003/auth/callback/line`）
3. ログインスコープ `profile` `openid` を有効化
4. 友だち判定対象の **公式LINEアカウント（Messaging API チャネル）と同じプロバイダー配下** に LINE Login チャネルを置くこと（friendship status API は同一プロバイダー内でのみ機能）
5. 公式LINEの Basic ID（`@xxx`）を `NEXT_PUBLIC_LINE_OA_BASIC_ID` に設定

---

## 10. 既存 `README.md` との乖離

| 既存 README の主張 | 実装 |
|---|---|
| Stripe Checkout / Billing Portal / Webhook | **未実装** （依存関係にも `stripe` なし） |
| Supabase + RLS + `ai_tool_lab_subscriptions` テーブル | **未実装** （`@supabase/*` 依存なし） |
| `GET /api/subscription?email=...` で外部ツールが契約状態を確認 | **存在せず**（`TOOL_API_SECRET` のみ env に残骸） |
| `/signup`, `/login` のメール+パスワード | LINE OAuth に置換（`/signup` は存在しない） |
| 月額 ¥980 / 14日トライアル | 課金なし、友だち登録による無料アクセス |

旧 README に書かれた内容を実装に追加するなら、Stripe SDK と Supabase クライアント、`/api/checkout` `/api/portal` `/api/webhooks/stripe` `/api/subscription` の各ルート、DB スキーマを新規に組む必要があります。

---

## 11. 既知の注意点

- **`secure` cookie の判定が `NODE_ENV` 依存**: `vercel dev` などで `production` 相当を試したい場合は明示設定が必要。
- **state TTL は 10 分**: ユーザーが LINE の認可画面で長く放置すると `state_mismatch` で `/login` に戻る。
- **`checkFriendship` が 401 を返した場合 false 扱い**: アクセストークン期限切れもこの分岐に落ちるため、ユーザーには「友だちでない」と同じ画面が出る。実際の原因切り分けはサーバーログ（`console.error` 出力）で行う必要あり。
- **`postcss.config.mjs` は本ドキュメント未確認**: Tailwind v4 の PostCSS 設定が想定どおり登録されているかは現物参照を推奨。
- **テストランナー未導入**: `npm test` は存在しない。導入する場合は Vitest か Jest を別途追加。
