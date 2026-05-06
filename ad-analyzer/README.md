# Ad Analyzer (Meta広告分析改善ツール)

Meta(Facebook/Instagram)広告のKPIを可視化し、AIで改善提案を行うダッシュボード。

- **デプロイ先**: https://ad-analyzer-ten.vercel.app/ai-advice
- **対象ユーザー**: AIツールラボ公式LINEの友だち登録者(本リポは認証スタンドアロン、ハブとは未連携)

---

## 主要機能

| 機能 | パス | 概要 |
|---|---|---|
| ダッシュボード | `/` | 9 KPI + 推移グラフ + アカウント別サマリー |
| 期間別レポート | `/reports/{daily,monthly,weekday,hourly}` | 期間ごとの集計 |
| 階層別レポート | `/{campaigns,adgroups,creatives}` | キャンペーン/広告グループ/広告 |
| 属性別レポート | `/demographics/{age,device,gender,region,summary}` | デモグラ分析 |
| AI改善提案 | `/ai-advice` | スコアリング + 改善案(localStorage で対応状況管理) |
| 一括出力 | `/export` | CSV / Excel / PowerPoint で全レポートを一括ダウンロード |
| 設定 | `/settings` | Meta広告アカウントの選択・接続管理 |

---

## 技術スタック

| 種別 | 採用 |
|---|---|
| Framework | Next.js **16.2.1** (App Router) |
| Runtime | React 19.2.4 / TypeScript ^5 |
| Styling | Tailwind CSS v4 |
| AI | `@anthropic-ai/sdk`(`claude-sonnet-4-20250514`) |
| 広告データ | Meta Marketing API v21.0 (`graph.facebook.com/v21.0`) |
| チャート | recharts ^3 |
| 出力 | pptxgenjs(PPTX) / xlsx(CSV/Excel) |
| アイコン | lucide-react |
| 日付 | date-fns |
| 認証 | Meta OAuth(自前実装、NextAuth 不使用) |
| 永続化 | **なし**(全て Cookie) |

---

## セットアップ

### 1. Meta App の作成

1. [Meta for Developers](https://developers.facebook.com/) で App を作成
2. Marketing API を追加し、以下の権限を申請
   - `ads_read` / `ads_management` / `business_management`
3. **Valid OAuth Redirect URIs** に `${NEXT_PUBLIC_APP_URL}/api/auth/meta/callback` を登録
4. App ID / App Secret を取得

### 2. 環境変数

```bash
# .env.local を作成
META_APP_ID=...
META_APP_SECRET=...
NEXT_PUBLIC_META_APP_ID=...   # META_APP_ID と同値を入れる
NEXT_PUBLIC_APP_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
```

| キー | 必須 | 用途 |
|---|:---:|---|
| `META_APP_ID` | ✅ | Meta App ID(サーバー側、トークン交換用) |
| `META_APP_SECRET` | ✅ | Meta App Secret |
| `NEXT_PUBLIC_META_APP_ID` | ✅ | クライアント側で認可URLを組み立てる用(`META_APP_ID` と同値) |
| `NEXT_PUBLIC_APP_URL` | ✅ | 本サイトのURL。redirect_uri の組み立てに使用 |
| `ANTHROPIC_API_KEY` | ✅ | AI改善提案で必須 |

### 3. 起動

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
```

---

## 認証 / データ保存先

### Meta OAuth フロー

```
GET /api/auth/meta              → Facebook 認可ダイアログへ
ユーザー承認
GET /api/auth/meta/callback
   ├ exchangeCodeForToken(code)        → 短期トークン
   ├ getLongLivedToken(shortToken)     → 長期トークン (≒60日)
   ├ getAdAccounts(longToken)          → 広告アカウント一覧
   └ Set-Cookie:
        meta_access_token  = <平文長期トークン>      (httpOnly, sameSite=lax, ≒60日)
        meta_ad_account_id = adAccounts[0].account_id (自動で先頭を選択)
   → 302 /
```

切り替え時は `POST /api/auth/select-account` で `meta_ad_account_id` / `meta_ad_account_name` Cookie を上書き。

### Cookie の中身

| Cookie | 中身 | 形式 |
|---|---|---|
| `meta_access_token` | Meta long-lived user access token | **平文** |
| `meta_ad_account_id` | 選択中の広告アカウントID(`act_` プレフィックスなし) | 平文 |
| `meta_ad_account_name` | 選択中の広告アカウント名 | URLエンコード |

> **DB / KV / 暗号化なし**。コード内に `// 本番ではDBに保存すべき` の TODO コメントが残存。

---

## API ルート一覧

| メソッド・パス | 役割 |
|---|---|
| `GET /api/auth/meta` | OAuth 開始 → Facebook 認可へ |
| `GET /api/auth/meta/callback` | OAuth コールバック → トークン取得 → Cookie 保存 |
| `GET /api/auth/accounts` | 広告アカウント一覧(Meta から再取得) |
| `POST /api/auth/select-account` | 利用アカウントを切り替え |
| `GET /api/auth/status` | ログイン状態確認 |
| `POST /api/auth/logout` | Cookie 削除(Meta側のトークン無効化はしない) |
| `GET /api/insights?breakdown=...` | 各 breakdown(daily/monthly/hourly/device/etc) のデータ取得 |
| `POST /api/ai` | AI改善提案(集計済みデータを受領 → Claude) |

---

## ⚠ 既知の問題(運用前に対処推奨)

### セキュリティ

1. **OAuth `state` パラメータ未使用** — CSRF 対策がない
2. **アクセストークン平文 Cookie** — 暗号化・JWT 化なし
3. **logout が Meta 側のトークンを無効化しない** — Cookie 削除のみで最大60日有効
4. **スコープが広い** — `ads_management` で広告の作成・編集・停止まで可能
5. **`POST /api/ai` の認証** — proxy.ts の LINE セッション検証で実質保護されているが、エンドポイント内で Cookie 検証していない

### Meta API 仕様への配慮不足

6. **`X-Business-Use-Case-Usage` ヘッダ未読** — レート制限接近を検知できない
7. **`code 80000 / 4 / 17 / 190` を判別せず** 全部「Meta API error」で握りつぶし
8. **指数バックオフ・リトライなし**
9. **DB なし** — 過去データを保存しないため Meta の保持期間制限に縛られる

---

## ドキュメント

- 詳細スキャン結果: 親リポの [`README.md`](../README.md) と [`ARCHITECTURE.md`](../ARCHITECTURE.md)
- ユーザーマニュアル: [`docs/manual.md`](./docs/manual.md)

---

## ライセンス・備考

- 本リポは内部利用想定
- `AGENTS.md` のとおり Next.js 16 の新仕様前提
- README はもともと create-next-app テンプレのままだったため本ドキュメントで全面書き換え
