# アーキテクチャ図

> Mermaid を使った実装ベースのアーキテクチャ図集。
> 詳細仕様は [`OVERVIEW.md`](./OVERVIEW.md)、セットアップは [`README.md`](./README.md) を参照。

---

## 1. システム全体（俯瞰図）

ユーザー / 本サイト（Next.js 16）/ LINE プラットフォーム / 外部AIツールの関係。

```mermaid
flowchart LR
    User([ユーザー<br/>ブラウザ / LINEアプリ内ブラウザ])

    subgraph App["ai-tool-lab-auth (Next.js 16 / Vercel)"]
        direction TB
        Pages["Pages<br/>/ /login /dashboard<br/>/account /not-friend"]
        ApiAuth["GET /api/auth/line"]
        ApiCb["GET /auth/callback/line"]
        ApiLogout["POST /api/logout"]
        Proxy["proxy.ts<br/>(route guard)"]
        LibAuth["lib/line/auth.ts"]
        LibFriend["lib/line/friendship.ts"]
        LibSession["lib/session.ts<br/>SESSION_COOKIE"]
        Manuals[("public/manuals/*.pdf")]
    end

    subgraph LINE["LINE Platform"]
        direction TB
        LineLogin["LINE Login<br/>access.line.me<br/>api.line.me/v2/profile"]
        LineMsg["Messaging API<br/>api.line.me/friendship/v1/status"]
        OA["公式LINEアカウント<br/>AIツールラボ"]
    end

    subgraph Tools["外部AIツール (別 Vercel デプロイ)"]
        Meta["Meta広告分析改善ツール"]
        SEO["SEO分析改善ツール"]
        Gmail["Gmail簡単管理ツール"]
    end

    User -->|HTTPS| Pages
    User -->|HTTPS| ApiAuth
    User -->|HTTPS| ApiCb
    User -->|HTTPS| ApiLogout

    Pages --> Proxy
    Proxy --> LibSession

    ApiAuth --> LibAuth
    ApiCb --> LibAuth
    ApiCb --> LibFriend
    ApiCb --> LibSession
    Pages --> LibSession
    Pages --> LibFriend
    Pages --> Manuals

    LibAuth -.OAuth 2.0.-> LineLogin
    LibFriend -.friendship status.-> LineMsg
    User -.友だち追加.-> OA

    Pages -.外部リンク (target=_blank).-> Meta
    Pages -.外部リンク.-> SEO
    Pages -.外部リンク.-> Gmail
```

---

## 2. 認証シーケンス（OAuth + friendship）

ログイン開始から `/dashboard` 到達まで（または `/not-friend` 分岐まで）の通信フロー。

```mermaid
sequenceDiagram
    autonumber
    actor U as ユーザー
    participant B as ブラウザ
    participant App as Next.js App
    participant Lib as lib/line/*<br/>lib/session
    participant LL as LINE Login<br/>(access.line.me)
    participant LM as LINE API<br/>(api.line.me)

    U->>B: /login を開く
    B->>App: GET /login
    App-->>B: ログイン画面 (緑ボタン)
    U->>B: 「LINEでログイン」クリック

    B->>App: GET /api/auth/line?redirect=...
    App->>Lib: signState(redirectPath)<br/>(HS256, exp=10min)
    Lib-->>App: state JWT
    App-->>B: 302 → access.line.me/oauth2/v2.1/authorize?<br/>client_id&state&scope=profile openid

    B->>LL: 認可ページ表示要求
    U->>LL: ログイン & 同意
    LL-->>B: 302 → /auth/callback/line?code&state

    B->>App: GET /auth/callback/line?code&state
    App->>Lib: verifyState(state)
    alt state 改竄 / 期限切れ
        Lib-->>App: null
        App-->>B: 302 /login?error=state_mismatch
    end

    App->>Lib: exchangeCodeForToken(code)
    Lib->>LL: POST /oauth2/v2.1/token
    LL-->>Lib: { access_token, id_token, ... }

    App->>Lib: fetchProfile(access_token)
    Lib->>LM: GET /v2/profile (Bearer)
    LM-->>Lib: { userId, displayName, pictureUrl }

    App->>Lib: checkFriendship(access_token)
    Lib->>LM: GET /friendship/v1/status (Bearer)
    LM-->>Lib: { friendFlag: boolean }

    alt friendFlag = false
        App-->>B: 302 /not-friend?name=...
        Note over B,U: 公式LINE追加QR + ボタン表示
    else friendFlag = true
        App->>Lib: signSession({ sub, name, picture, accessToken })
        Lib-->>App: session JWT
        App-->>B: 302 redirectPath or /dashboard<br/>Set-Cookie: ai_tool_lab_session<br/>(httpOnly, sameSite=lax, 30d)
        B->>App: GET /dashboard
        App->>Lib: getSession() + checkFriendship() (再確認)
        App-->>B: 3ツールカードを表示
    end
```

---

## 3. ルート保護（`proxy.ts`）の判定フロー

Next.js 16 の **proxy（旧 middleware）** が各リクエストで何を判定しているか。

```mermaid
flowchart TD
    Req([リクエスト]) --> Match{matcher 対象?<br/>※_next/static, _next/image,<br/>favicon.ico, api/*,<br/>auth/callback/* は除外}
    Match -->|除外| Pass[NextResponse.next<br/>（middleware を素通り）]
    Match -->|対象| GetCookie[Cookie<br/>'ai_tool_lab_session' を取得]

    GetCookie --> Verify{jose.jwtVerify<br/>SESSION_SECRET で検証}
    Verify -->|成功| Authed[isAuthed = true]
    Verify -->|失敗 / 不在 / 鍵未設定| NotAuthed[isAuthed = false]

    Authed --> CheckLogin{path == /login ?}
    CheckLogin -->|Yes| RedirectDash[302 /dashboard]
    CheckLogin -->|No| Allow[NextResponse.next]

    NotAuthed --> CheckProtected{path が<br/>/dashboard or /account で<br/>始まる?}
    CheckProtected -->|Yes| RedirectLogin[302 /login?redirect=path]
    CheckProtected -->|No| AllowPublic[NextResponse.next]
```

ポイント:

- 認証判定は JWT の検証だけ。DB 参照なし → ステートレス
- `SESSION_SECRET` 未設定だと `isAuthed` が常に `false` になり、保護ページは全て `/login` へ
- 既ログイン状態で `/login` を踏むと自動で `/dashboard` へ進む

---

## 4. モジュール依存図

ファイルレベルの依存関係。`@/*` パスエイリアスはリポジトリルートを指す。

```mermaid
flowchart LR
    subgraph Pages["app/ (Pages & Routes)"]
        RootPage["page.tsx (/)"]
        LoginPage["login/page.tsx"]
        LoginForm["login/login-form.tsx"]
        Dashboard["dashboard/page.tsx"]
        Account["account/page.tsx"]
        NotFriend["not-friend/page.tsx"]
        ApiAuthLine["api/auth/line/route.ts"]
        ApiLogout["api/logout/route.ts"]
        Callback["auth/callback/line/route.ts"]
    end

    subgraph Libs["lib/"]
        Session["session.ts<br/>SESSION_COOKIE<br/>signSession / getSession"]
        Auth["line/auth.ts<br/>signState / verifyState<br/>buildAuthorizeUrl<br/>exchangeCodeForToken<br/>fetchProfile"]
        Friend["line/friendship.ts<br/>checkFriendship<br/>getAddFriendUrl / getBasicId"]
    end

    Proxy["proxy.ts (middleware)"]

    Dashboard --> Session
    Dashboard --> Friend
    Account --> Session
    Account --> Friend
    NotFriend --> Friend

    ApiAuthLine --> Auth
    Callback --> Auth
    Callback --> Friend
    Callback --> Session
    ApiLogout --> Session

    Proxy --> Session

    LoginPage --> LoginForm
```

---

## 5. データ・トークンの流れ

何がどこに保存され、どこを通るか。

```mermaid
flowchart LR
    subgraph Browser["ブラウザ"]
        Cookie[("Cookie<br/>ai_tool_lab_session<br/>= session JWT")]
    end

    subgraph URL["URL parameters"]
        StateJwt(["state= JWT<br/>(authorize → callback)"])
        Code(["code= (callback)"])
        ErrorParam(["error= (login)"])
    end

    subgraph Server["サーバーメモリ (リクエスト中のみ)"]
        AccessToken["LINE access_token"]
        Profile["LINE profile<br/>{userId, displayName, pictureUrl}"]
        FriendFlag["friendFlag"]
    end

    subgraph Env["環境変数 (server)"]
        Secret["SESSION_SECRET"]
        ChId["LINE_LOGIN_CHANNEL_ID"]
        ChSec["LINE_LOGIN_CHANNEL_SECRET"]
    end

    Secret -.署名.-> StateJwt
    Secret -.署名.-> Cookie

    Code --> AccessToken
    AccessToken --> Profile
    AccessToken --> FriendFlag
    AccessToken -.payload に内包.-> Cookie

    Profile -.payload に内包.-> Cookie
```

注意点:

- LINE access_token は **セッション JWT の payload** に格納されて Cookie で運ばれる（`/dashboard` での再 friendship 判定に使うため）
- `SESSION_SECRET` が漏れると state も session も偽造可能になるため、本番では確実にローテーション可能な鍵管理を行うこと
- DB やセッションストアは存在せず、**全てステートレス**

---

## 6. 凡例

| 記号 | 意味 |
|---|---|
| 実線矢印 | HTTP リクエスト・関数呼び出し（同期的依存） |
| 点線矢印 | 外部サービスへの通信 / 影響関係 |
| 二重円 (`actor`) | ヒトのユーザー |
| `[(...)]` | データストア・永続化要素 |
| `subgraph` | 同一の信頼境界・物理境界に属するもの |
