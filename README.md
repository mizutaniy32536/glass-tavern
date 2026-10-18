# Glass Tavern

Mac・スマートフォン向けの日本語キャラチャット。Cloudflareで独立稼働するアプリです。SillyTavern本体のフォークではなく、カード・会話のインポートとエクスポートに対応します。

## 開発

Node.js 22 LTS を使用します。

```sh
npm ci
cp .env.example .dev.vars
# .dev.vars に APP_ORIGIN=http://localhost:4197 を追加
# KEY_ENCRYPTION_SECRET は openssl rand -base64 32 で作成（公開しない）
npm run build
npm run db:local
npm run dev:api
# 別のターミナル
npm run dev
```

`http://localhost:4197` を開きます。`DEV_AUTH=true` とループバックホストの両方を満たす場合だけ、ローカルテストログインとAI生成なしのモックが使えます。本番でDEV_AUTHを設定しないでください。

## Cloudflare

`wrangler.jsonc` のD1を自分のDBに変更して、`APP_ORIGIN` を実際のHTTPS公開元に合わせます。Google CloudでWebアプリのOAuthクライアントを作成し、コールバックを `{APP_ORIGIN}/auth/callback` に登録します。`GOOGLE_CLIENT_ID` は変数、`GOOGLE_CLIENT_SECRET` と32バイトbase64の `KEY_ENCRYPTION_SECRET` は `wrangler secret put` で設定します。

```sh
npx wrangler d1 migrations apply glass-tavern --remote
npm run build
npx wrangler deploy
```

APIキーを変更せずに暗号化キーを破棄すると復号できません。鍵の更新には既存キーの再暗号化が必要です。HTTPSでのみ運用してください。料金と利用制限は各AI事業者の条件に従います。

## 確認

```sh
npm run typecheck
npm test
npm run build
```

モックの返答は実AI接続の合格には数えません。Google OAuthと各AI実生成は有効な資格情報を用いた別の確認が必要です。

## 互換性

- SillyTavern V2/V3 JSON、PNG `tEXt` 内の `chara` / `ccv3` カードを読み込みます。
- 未知のカードフィールドを `source` に保持して書き出しへ戻します。キャラ設定・挨拶・名前を編集できます。
- JSONL会話のヘッダーメタデータ、本文、発話ロールを保持します。メッセージごとの未知フィールド・日時・swipes・extraも保持します。ステータスはヘッダーの独自拡張へ保存します。
- personality、scenario、system_prompt、post_history_instructions、mes_example と常時有効のロア項目をプロンプトへ含めます。
- キーワード発火のLorebook、マクロ展開、正規表現拡張、グループチャット、ST専用プリセットは実行しません。値はカード内に保持されます。
- PNG内の画像は最大512pxのJPEGサムネイルとして読み込みます。編集画面で300KB以下の画像も追加できます。
- JSONカードは5MB以下、保存キャラ全体はUTF-8 1MB以下、会話はUTF-8 1.5MB以下です。
- ステータスはAIの返答にJSONが含まれる場合に検証して更新します。非対応のモデルは本文表示のみになります。

[技術選定と設計](docs/architecture.md) / [プライバシー](docs/privacy.md)

## ライセンス

AGPL-3.0-or-later。SillyTavernのコードやアセットは含めていません。SillyTavern互換フォーマットへの対応は独立実装です。SillyTavernはその開発者によるAGPL-3.0のプロジェクトです。Zeta / チャチャとは関係のない独立アプリで、名称・画像・文章・コードを複製しません。
