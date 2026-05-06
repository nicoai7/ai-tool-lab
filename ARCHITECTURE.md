# AI Tool Lab — システム全体アーキテクチャ

4プロジェクトの相関関係、認証フロー、データ保存先、外部API依存を図示します。
詳細仕様は各プロジェクトの README とサブディレクトリ内 `OVERVIEW.md` を参照。

---

## 1. プロジェクト相関図(全体俯瞰)

ユーザーから見た4ツールと外部サービスの関係。

```mermaid
flowchart LR
    User([ユーザー])

    subgraph "ai-tool-lab/"
        direction TB
        Auth["auth<br/>LINE認証ハブ<br/>port 3003"]
        Ads["ad-analyzer<br/>Meta広告分析<br/>port 3000"]
        Seo["seo-tool<br/>SEO記事<br/>port 3000"]
        Mail["email-tool<br/>Gmail要約<br/>port 3000"]
    end

    subgraph "外部サービス"
        LINE[LINE Platform]
        Meta[Meta Marketing API]
        Google[Google OAuth + Gmail]
        Anthropic[Anthropic Claude]
        Supa[Supabase]
    end

    User --> Auth
    User --> Ads
    User --> Seo
    User --> Mail

    Auth -.認証.-> LINE
    Auth -.外部リンク.-> Ads
    Auth -.外部リンク.-> Seo
    Auth -.外部リンク.-> Mail

    Seo -.認証.-> LINE
    Seo -.AI.-> Anthropic
    Seo -.永続化.-> Supa

    Ads -.認証.-> Meta
    Ads -.広告データ.-> Meta
    Ads -.AI.-> Anthropic

    Mail -.認証.-> Google
    Mail -.メール取得.-> Google
    Mail -.AI.-> Anthropic
    Mail -.永続化.-> Supa
```

> ⚠ **`auth` ハブと3ツールはコードレベルで連携していません**。`auth/dashboard` の「ツールを開く」ボタンは外部リンクとして別タブを開くだけで、各ツールへ認証情報は渡りません。3ツールはそれぞれ独自に認証を持ちます。

---

## 2. 認証パターン比較(横並び)

各ツールがどの ID プロバイダを使ってどこにセッションを保存するか。

```mermaid
flowchart TB
    subgraph A1["auth — LINE OAuth"]
        A_User([User])
        A_LINE[LINE Login + friendship]
        A_Cookie[(Cookie<br/>ai_tool_lab_session<br/>JWT HS256, 30日)]
        A_User --> A_LINE --> A_Cookie
    end

    subgraph S1["seo-tool — LINE OAuth"]
        S_User([User])
        S_LINE[LINE Login + friendship]
        S_Cookie[(Cookie<br/>ai_tool_lab_session<br/>JWT HS256, 30日)]
        S_DB[(Supabase<br/>articles/audits/seo_settings)]
        S_User --> S_LINE --> S_Cookie
        S_Cookie --> S_DB
    end

    subgraph D1["ad-analyzer — Meta OAuth"]
        D_User([User])
        D_Meta[Meta OAuth v21.0]
        D_Cookie[(Cookie<br/>meta_access_token + ad_account_id<br/>**平文**, 60日)]
        D_User --> D_Meta --> D_Cookie
    end

    subgraph M1["email-tool — Google OAuth via NextAuth v5"]
        M_User([User])
        M_Google[Google OAuth + Gmail scope]
        M_NA[(NextAuth JWT Cookie<br/>暗号化)]
        M_DB[(Supabase gmail_accounts<br/>**平文**access_token,refresh_token)]
        M_User --> M_Google --> M_NA
        M_Google --> M_DB
    end
```

注目点:

- **`auth` と `seo-tool` は同じ Cookie 名 `ai_tool_lab_session` を使う** — `SESSION_SECRET` を共有していれば理論上は相互認証できるが、現状そう運用されているかは未確認
- **ad-analyzer のみ平文 Cookie + 暗号化なし** — セキュリティリスク
- **email-tool は NextAuth + Supabase の二重保存** — 不整合の可能性あり

---

## 3. LINE OAuth フロー(auth と seo-tool が共有する仕組み)

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant App as Next.js App<br/>(auth or seo-tool)
    participant LL as LINE Login
    participant LM as LINE Messaging API

    U->>App: GET /login
    App-->>U: ログインボタン表示
    U->>App: 「LINEでログイン」クリック

    App->>App: signState(redirectPath)<br/>HS256 JWT, 10分TTL
    App-->>LL: 302 access.line.me/oauth2/v2.1/authorize<br/>scope=profile openid
    U->>LL: 承認
    LL-->>App: 302 /auth/callback/line?code&state

    App->>App: verifyState(state) で改竄検証
    App->>LL: POST /oauth2/v2.1/token (code → access_token)
    App->>LM: GET /v2/profile (Bearer)
    LM-->>App: { userId, displayName, pictureUrl }
    App->>LM: GET /friendship/v1/status
    LM-->>App: { friendFlag }

    alt friendFlag = false
        App-->>U: 302 /not-friend?name=...<br/>QR + 友だち追加ボタン
    else friendFlag = true
        App->>App: signSession({sub, name, picture, accessToken})
        App-->>U: 302 /dashboard<br/>Set-Cookie: ai_tool_lab_session<br/>(httpOnly, 30日, HS256)
    end

    Note over App,LM: seo-tool は さらに Anthropic 呼出 + Supabase 保存
```

---

## 4. Meta OAuth フロー(ad-analyzer 専用、CSRF対策**未実装**)

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant App as ad-analyzer
    participant FB as Facebook OAuth
    participant Graph as Meta Graph API

    U->>App: ログインボタン
    App-->>FB: 302 dialog/oauth<br/>scope=ads_read,ads_management,business_management<br/>**state パラメータなし**
    U->>FB: 承認
    FB-->>App: GET /api/auth/meta/callback?code

    App->>Graph: POST /oauth/access_token (短期トークン交換)
    App->>Graph: GET /oauth/access_token?grant_type=fb_exchange_token<br/>(長期化、≒60日)
    Graph-->>App: long-lived access_token
    App->>Graph: GET /me/adaccounts
    Graph-->>App: 広告アカウント一覧

    App-->>U: 302 /<br/>Set-Cookie:<br/>meta_access_token (平文)<br/>meta_ad_account_id (先頭を自動選択)

    Note over App,Graph: ⚠ state 検証なし → CSRF 攻撃可能<br/>⚠ Cookie は平文、JWT化なし<br/>⚠ logout は Cookie 削除のみ、トークン無効化しない
```

---

## 5. Gmail OAuth フロー(email-tool 専用、NextAuth v5 経由)

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant App as email-tool
    participant NA as NextAuth v5
    participant GA as Google OAuth
    participant Gmail as Gmail API
    participant Supa as Supabase

    U->>App: 「Googleでログイン」
    App->>NA: signIn("google", { redirectTo: "/dashboard" })
    NA-->>GA: 302 認可<br/>scope=openid email profile gmail.readonly gmail.modify<br/>access_type=offline, prompt=consent

    U->>GA: 承認
    GA-->>NA: callback?code

    NA->>NA: jwt callback<br/>token に accessToken / refreshToken / expiresAt 格納<br/>token.ownerEmail = token.email (初回のみ)

    NA->>Supa: upsertGmailAccount({user_email, gmail_email, access_token, refresh_token, expires_at})
    Note right of Supa: 平文保存、UNIQUE(user_email,gmail_email)

    NA-->>U: Set-Cookie<br/>NextAuth JWT(AUTH_SECRET で暗号化)
    NA-->>U: 302 /dashboard

    Note over U,Supa: アカウント追加: GET /api/accounts/add<br/>→ signIn("google") 再実行 → 別 gmail_email で行追加
```

---

## 6. データ保存先(全プロジェクト統合)

```mermaid
flowchart LR
    subgraph Browser["ブラウザ"]
        AuthCookie[("auth_lab_session<br/>auth + seo-tool 共通名")]
        MetaCookie[("meta_access_token<br/>**平文**")]
        NextAuthCookie[("NextAuth JWT<br/>暗号化")]
        SS["sessionStorage<br/>improve_result/audit_result<br/>(seo-tool)<br/>competitor_analysis_cache<br/>(ad-analyzer)"]
        LS["localStorage<br/>ad-analyzer-improvement-status<br/>(ad-analyzer)"]
    end

    subgraph Server["サーバー(Vercel Functions, リクエスト中のみ)"]
        TokenMem["LINE access_token<br/>Meta access_token<br/>Gmail access_token"]
        AIPrompt["Claude プロンプト"]
    end

    subgraph SupaDB["Supabase(共有 OR 別プロジェクト)"]
        SeoTables["articles<br/>audits<br/>seo_settings<br/>(seo-tool)"]
        EmailTable["gmail_accounts<br/>(email-tool)<br/>**access_token/refresh_token 平文**"]
    end

    AuthCookie -.含む.-> TokenMem
    MetaCookie -.そのまま使用.-> TokenMem
    NextAuthCookie -.解読 → 取得.-> TokenMem
    EmailTable -.読み込み.-> TokenMem

    TokenMem -.外部API呼出に使用.-> AIPrompt
```

注目点:

- **DB に永続化されるトークンは email-tool のみ**(Gmail API は refresh_token が必須なため)
- **ad-analyzer は永続化なし** → ブラウザを閉じても再ログインせずに済むが、平文 Cookie のリスクあり
- **seo-tool の articles / audits は Supabase 永続化** だが、認証情報自体は Cookie のみ

---

## 7. AI モデル使用マップ

```mermaid
flowchart LR
    subgraph Tools["各ツールの AI 呼出箇所"]
        AdsAI["ad-analyzer<br/>POST /api/ai<br/>(改善提案)"]
        AdsComp["ad-analyzer<br/>GET /api/competitors<br/>(競合分析、max_tokens 8192)"]
        SeoAna["seo-tool<br/>create-analyze<br/>(web_search 5回まで)"]
        SeoArt["seo-tool<br/>create-article<br/>(max_tokens 16384)"]
        SeoImp["seo-tool<br/>improve-analyze/rewrite"]
        SeoAud["seo-tool<br/>audit"]
        MailAna["email-tool<br/>analyzeEmails<br/>(max_tokens 4096)"]
    end

    subgraph Models["Anthropic モデル"]
        S420["claude-sonnet-4-20250514<br/>(ad-analyzer / email-tool)"]
        S46["claude-sonnet-4-6<br/>(seo-tool)"]
    end

    AdsAI --> S420
    AdsComp --> S420
    MailAna --> S420
    SeoAna --> S46
    SeoArt --> S46
    SeoImp --> S46
    SeoAud --> S46
```

> モデル名が **ツール間で揃っていない**(`-20250514` vs `-4-6`)。プロジェクトごとに別タイミングでハードコードされた可能性。

---

## 8. ツール間依存図(意図された連携 vs 実態)

```mermaid
flowchart LR
    subgraph Intended["意図された連携(推測)"]
        I_Auth[auth が認証ハブ]
        I_Ads[ad-analyzer]
        I_Seo[seo-tool]
        I_Mail[email-tool]

        I_Auth --セッション共有--> I_Ads
        I_Auth --セッション共有--> I_Seo
        I_Auth --セッション共有--> I_Mail
    end

    subgraph Actual["実態(コードベース)"]
        A_Auth[auth]
        A_Ads[ad-analyzer]
        A_Seo[seo-tool]
        A_Mail[email-tool]

        A_Auth -.外部リンクのみ.-> A_Ads
        A_Auth -.外部リンクのみ.-> A_Seo
        A_Auth -.外部リンクのみ.-> A_Mail

        A_Seo -.独自に LINE OAuth.-> Lin1[LINE]
        A_Auth -.LINE OAuth.-> Lin1
        A_Ads -.独自に Meta OAuth.-> Met1[Meta]
        A_Mail -.独自に Google OAuth.-> Goo1[Google]
    end
```

ギャップの原因と影響:

- 各ツールがそれぞれ独立した OAuth フローを持つため、**ユーザーは4回ログインが必要**(LINE x2、Meta x1、Google x1)
- `auth` ハブの `TOOL_API_SECRET` env 変数は `.env.example` に存在するが、コード内で参照されていない → 「各ツールから認証ハブへ契約状態を問い合わせる」設計の名残と推測
- 認証情報が**ツールごとに分散**しているため、ハブで一括ログアウトしても各ツールのセッションは生き残る

---

## 9. 凡例

| 記号 | 意味 |
|---|---|
| 実線矢印(→) | HTTP リクエスト・関数呼び出し(同期的依存) |
| 点線矢印(-.-> ) | 外部サービス通信 / 影響関係 |
| 二重円(`actor`) | ヒトのユーザー |
| `[(...)]` | データストア・永続化要素 |
| `subgraph` | 同一の信頼境界・物理境界に属するもの |

---

## 10. 改善優先度(プロジェクト横断)

| # | 問題 | 該当ツール | 緊急度 |
|---|---|---|:---:|
| 1 | OAuth `state` 未使用(CSRF) | ad-analyzer | 🔴 |
| 2 | Anthropic 呼出に認証チェックなし(課金 DoS) | ad-analyzer (`/api/ai`, `/api/competitors`) | 🔴 |
| 3 | アクセストークン平文 Cookie | ad-analyzer | 🔴 |
| 4 | アクセストークン平文 Supabase | email-tool | 🔴 |
| 5 | DELETE /api/accounts 所有権チェックなし(IDOR) | email-tool | 🔴 |
| 6 | SSRF — 任意URL fetch | seo-tool (`improve-analyze`, `audit`) | 🟡 |
| 7 | Meta API レート制限ヘッダ未読 | ad-analyzer | 🟡 |
| 8 | キャッシュ層が無く外部API毎回叩く | 全ツール | 🟡 |
| 9 | RLS 無効化 + service_role 直叩き | seo-tool, email-tool | 🟡 |
| 10 | プロンプトキャッシュ未使用(コスト) | email-tool, seo-tool | 🟢 |
| 11 | リフレッシュトークン管理に問題(`expires_at` 更新漏れ) | email-tool | 🟢 |

詳細は各プロジェクトの README の「⚠ 既知の問題」セクションを参照。

---

## 11. 認証ハブと3ツールを統合するなら(設計提案)

現状の独立構成から、`auth` を真の認証ハブにするなら以下が必要:

1. `auth` 側で各ツールへの「ワンタイムトークン」を発行する API(`POST /api/issue-tool-token`)
2. 各ツールはハブの `GET /api/verify-tool-token?token=...` を叩いて検証
3. ハブの `SESSION_SECRET` を **JWKS エンドポイントで公開**(共通鍵共有でなく公開鍵検証へ)
4. ハブの `/dashboard` から各ツールへ遷移する際にワンタイムトークンを付与
5. 各ツールは初回アクセス時にトークンを検証し、自前のセッションを発行

この設計を入れない限り、ユーザーは引き続き各ツールごとに OAuth ログインを繰り返す必要があります。

---

## 12. ドキュメント参照

- 全体README: [`README.md`](./README.md)
- 各プロジェクト:
  - [`auth/README.md`](./auth/README.md) / [`auth/OVERVIEW.md`](./auth/OVERVIEW.md) / [`auth/ARCHITECTURE.md`](./auth/ARCHITECTURE.md)
  - [`ad-analyzer/README.md`](./ad-analyzer/README.md) / [`ad-analyzer/docs/manual.md`](./ad-analyzer/docs/manual.md)
  - [`seo-tool/README.md`](./seo-tool/README.md)
  - [`email-tool/README.md`](./email-tool/README.md) / [`email-tool/manual.md`](./email-tool/manual.md)
