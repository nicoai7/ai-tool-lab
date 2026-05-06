# 統合移行ガイド(`ai-tool-lab.net` パスベース構成)

このドキュメントは、4つの Vercel プロジェクトを **`ai-tool-lab.net` 配下のパスベース** に統合するための手動作業手順書です。

## 完成形

```
https://ai-tool-lab.net/                    → auth プロジェクト(認証ハブ + ランディング)
https://ai-tool-lab.net/login               → LINE ログイン
https://ai-tool-lab.net/dashboard           → ツール一覧
https://ai-tool-lab.net/ad-analyzer/...     → ad-analyzer プロジェクトへ rewrite
https://ai-tool-lab.net/seo/...             → seo-tool プロジェクトへ rewrite
https://ai-tool-lab.net/email/...           → email-tool プロジェクトへ rewrite
```

---

## 1. ドメインを Vercel に向ける(お名前.com 設定)

1. お名前.com Navi にログイン
2. 「ドメイン」 → `ai-tool-lab.net` を選択
3. 「ネームサーバー設定」 → **「その他のネームサーバー」** を選択
4. 以下を入力:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
5. 設定 → 反映を待つ(最大48時間、通常1〜2時間)

> ⚠ 反映中は ai-tool-lab.net が一時的に解決できなくなる可能性があります。深夜などに実施を推奨。

---

## 2. Vercel に独自ドメインを割り当て

**auth プロジェクト**(認証ハブ)にだけ `ai-tool-lab.net` を追加します。他の3プロジェクトは引き続き `*.vercel.app` で動きます(rewrite で背後にプロキシ)。

1. Vercel ダッシュボード → `ai-tool-lab-auth` プロジェクト
2. **Settings → Domains → Add**
3. `ai-tool-lab.net` と `www.ai-tool-lab.net` を追加
4. SSL 証明書は Vercel が自動発行(Let's Encrypt)

---

## 3. LINE Developers に Callback URL 追加

[LINE Developers Console](https://developers.line.biz/) → LINE ログインチャネル → **LINEログイン設定** → **コールバックURL**

以下を追加(既存はそのままでも OK):

```
https://ai-tool-lab.net/auth/callback/line
https://ai-tool-lab.net/seo/auth/callback/line
```

> ローカル開発用の `http://localhost:3003/auth/callback/line` 等は削除しなくて構いません。

---

## 4. Meta Developers に OAuth Redirect URIs 追加

[Meta for Developers](https://developers.facebook.com/) → アプリ → Facebook Login → 設定

**Valid OAuth Redirect URIs** に以下を追加:

```
https://ai-tool-lab.net/ad-analyzer/api/auth/meta/callback
```

---

## 5. Google Cloud Console に Authorized redirect URI 追加

[Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → 認証情報 → OAuth 2.0 クライアントID

**Authorized redirect URIs** に以下を追加:

```
https://ai-tool-lab.net/email/api/auth/callback/google
```

---

## 6. 各 Vercel プロジェクトの環境変数を更新

### 全プロジェクト共通(SSO のため必ず同値)

| キー | 値 |
|---|---|
| `SESSION_SECRET` | **4プロジェクトすべてで同一値** にする(例: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` で生成した値) |

### auth プロジェクト

| キー | 値 |
|---|---|
| `LINE_LOGIN_CHANNEL_ID` | (既存) |
| `LINE_LOGIN_CHANNEL_SECRET` | (既存) |
| `SESSION_SECRET` | **共通値**(変更すると全員ログアウト) |
| `NEXT_PUBLIC_SITE_URL` | `https://ai-tool-lab.net` |
| `NEXT_PUBLIC_LINE_OA_BASIC_ID` | (既存) |

### ad-analyzer プロジェクト

| キー | 値 |
|---|---|
| `META_APP_ID` | (既存) |
| `META_APP_SECRET` | (既存) |
| `NEXT_PUBLIC_META_APP_ID` | (既存、`META_APP_ID` と同値) |
| `NEXT_PUBLIC_APP_URL` | `https://ai-tool-lab.net` ← 変更 |
| `ANTHROPIC_API_KEY` | (既存) |
| `SESSION_SECRET` | **共通値**(新規追加) |
| `AUTH_HUB_URL` | `https://ai-tool-lab.net`(新規追加) |

### seo-tool プロジェクト

| キー | 値 |
|---|---|
| `LINE_LOGIN_CHANNEL_ID` | (既存) |
| `LINE_LOGIN_CHANNEL_SECRET` | (既存) |
| `SESSION_SECRET` | **共通値** |
| `NEXT_PUBLIC_SITE_URL` | `https://ai-tool-lab.net` ← 変更 |
| `NEXT_PUBLIC_LINE_OA_BASIC_ID` | (既存) |
| `NEXT_PUBLIC_SUPABASE_URL` | (既存) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (既存) |
| `SUPABASE_SERVICE_ROLE_KEY` | (既存) |
| `ANTHROPIC_API_KEY` | (既存) |
| `AUTH_HUB_URL` | `https://ai-tool-lab.net`(新規追加) |

### email-tool プロジェクト

| キー | 値 |
|---|---|
| `GOOGLE_CLIENT_ID` | (既存) |
| `GOOGLE_CLIENT_SECRET` | (既存) |
| `AUTH_SECRET` | (既存、NextAuth 用) |
| `AUTH_URL` | `https://ai-tool-lab.net/email` ← 変更(NextAuth が basePath を検出) |
| `NEXT_PUBLIC_SUPABASE_URL` | (既存) |
| `SUPABASE_SERVICE_ROLE_KEY` | (既存) |
| `ANTHROPIC_API_KEY` | (既存) |
| `SESSION_SECRET` | **共通値**(新規追加、LINE ゲート用) |
| `AUTH_HUB_URL` | `https://ai-tool-lab.net`(新規追加) |

---

## 7. デプロイ順序

1. **auth プロジェクトをデプロイ**
   - `vercel.json` の rewrites 設定が反映される
   - `proxy.ts` でツールパスへのアクセスを LINE 認証必須に
2. **ad-analyzer / seo-tool / email-tool をそれぞれデプロイ**
   - `next.config.ts` の `basePath` が反映される
   - 各 middleware が Host チェック + LINE セッション検証を行う

> Vercel の **Preview デプロイ** で動作確認してから Production へ promote するのが安全。

---

## 8. 動作確認チェックリスト

### 認証フロー
- [ ] `https://ai-tool-lab.net/` でランディングが表示される
- [ ] 「LINEでログイン」を押すと LINE 認可画面に飛ぶ
- [ ] 友だち未登録の場合は `/not-friend` に飛ぶ
- [ ] 認証成功で `/dashboard` のツール一覧が表示される

### 各ツールへのアクセス
- [ ] `https://ai-tool-lab.net/ad-analyzer/ai-advice` で ad-analyzer が表示される
- [ ] `https://ai-tool-lab.net/seo/dashboard` で seo-tool が表示される
- [ ] `https://ai-tool-lab.net/email/dashboard` で email-tool が表示される
- [ ] **未認証で各ツールに直アクセスすると `/login` にリダイレクトされる**

### 直アクセス遮断
- [ ] `https://ad-analyzer-ten.vercel.app/` を直接開いても **403 Forbidden** が返る
- [ ] `https://seo-improve-tool.vercel.app/` を直接開いても **403 Forbidden** が返る
- [ ] `https://email-tool-lime-kappa.vercel.app/` を直接開いても **403 Forbidden** が返る

### 各ツールの OAuth(2層認証)
- [ ] ad-analyzer で Meta OAuth が完了し、広告データが表示される
- [ ] email-tool で Google OAuth が完了し、Gmail が表示される

### 内部 API
- [ ] ad-analyzer の `/ad-analyzer/api/insights?...` が認証済みで叩ける
- [ ] seo-tool の `/seo/api/seo`(POST)が認証済みで叩ける
- [ ] email-tool の `/email/api/emails` が認証済みで叩ける

---

## 9. ロールバック手順

問題が発生した場合の戻し方:

1. **Vercel auth プロジェクトの `vercel.json` を空に戻す**(rewrites 削除) → 各ツールへの統合経路が消える
2. **各プロジェクトの `next.config.ts` から `basePath` を削除** → 各プロジェクトが従来どおり `*.vercel.app` で動く
3. **Vercel auth プロジェクトから `ai-tool-lab.net` ドメインを削除**(必要に応じて)
4. **お名前.com のネームサーバー** はすぐには戻さなくて良い(rewriteを削除すれば問題なし)

---

## 10. 既知の懸念事項・運用注意

- **`SESSION_SECRET` を変更すると全員ログアウト**します。本番運用後は変更不可と思って管理してください
- **`*.vercel.app` 直アクセスを完全に塞ぐ**には、各プロジェクトの middleware 内 Host チェックを ON のまま運用すること(コードで実装済み)
- **`ai-tool-lab.net` で Cookie が発行されるため**、サブドメイン側(将来的に `something.ai-tool-lab.net` を作った場合)に Cookie が漏れない設計になっています(`Domain` 属性なし=ホスト限定)
- **既存ユーザーのブックマーク**(`*.vercel.app/...`)は **403 Forbidden** で開けなくなります。アナウンスを推奨

---

## 11. デモ環境用の暫定対応(本番ドメイン切替前)

ai-tool-lab.net を Vercel に向ける前に動作確認したい場合:

1. 各プロジェクトの middleware の `ALLOWED_HOSTS` に `localhost` を許可するか、`NODE_ENV !== 'production'` のときバイパスする(現在のコードがそうなっています)
2. `AUTH_HUB_URL` を `http://localhost:3003` 等に設定
3. ローカルで4プロジェクトを別ポートで起動し、`http://localhost:3003/ad-analyzer/...` のように rewrite を試す

ただし rewrite を本格的にローカルで試すには Vercel CLI(`vercel dev`)が必要。
