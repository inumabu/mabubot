# 🌙 まぶBot

Discordサーバーをもっと楽しく、もっと便利にする **TypeScript製Discord Bot** です。

[![CI](https://github.com/inumabu/mabubot/actions/workflows/ci.yml/badge.svg)](https://github.com/inumabu/mabubot/actions/workflows/ci.yml)

> 💡 **コンセプト**
>
> コマンドを機能ごとのモジュールに分け、Discordとの入出力・ビジネスロジック・DBアクセスを整理しながら育てられる構成を目指しています。

---

## ✨ できること

- 👋 オンボーディング、ヘルプ、Welcomeメッセージ
- 💬 雑談、トピック、感謝、匿名フィードバック
- 📣 募集、イベント、投票、写真投稿
- 💰 ポイント、ショップ、Gacha、Mission、ギフト
- 🪪 プロフィール、称号、レベル、誕生日、連続ログイン
- 🎮 Mystery、Quiz、Wolf、Race、Fishing、Raidなどのゲーム
- 📊 統計、ランキング、実績、週間サマリー、Analytics
- 🤖 OpenAI互換APIを利用したAI応答
- 🛡️ AutoMod、監査ログ、設定管理
- 🔊 一時Voice Channelの自動作成・整理

現在、**10個の公開Slash Command**に統合しています。内部には48個の旧Command実装が残っており、47個を互換層として再利用し、旧Help実装の1個は新しい `/help` に置き換えています。

---

## 🚀 クイックスタート

### 1. 必要な環境

- 🟢 Node.js **22.16以降**
- 📦 npm
- 🤖 Discord Application / Bot Token
- 💾 DB・画像を保存できるFilesystem

### 2. インストール

```sh
npm ci
cp .env.example .env
```

PowerShell では次のコマンドで設定ファイルを作成できます。

```powershell
npm ci
Copy-Item .env.example .env
```

### 3. `.env`を設定

最低限、次の2つを設定してください。

```dotenv
DISCORD_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-application-id
```

AI機能を使う場合は、次も設定します。

```dotenv
AI_API_KEY=your-api-key
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

### 4. 開発・起動

```sh
# 🧪 型チェック
npm run typecheck
npm run typecheck:tests

# ✅ テスト
npm test

# 📋 Slash Commandの確認
npm run verify:commands

# 🔨 ビルド
npm run build

# ▶️ 起動
npm start
```

開発中はファイル変更を監視できます。

```sh
npm run dev
```

`npm test` は Node.js のテストランナーを使うクロスプラットフォーム Script です。Unix 固有のファイル検索や環境変数前置き構文に依存しないため、Windows / PowerShell でも同じコマンドを実行できます。

---

## 🧭 Slash Command一覧

48個の旧Command実装を、**10個の公開Slash Command**へ統合しています。機能は削除せず、カテゴリの下へまとめています。

| カテゴリ | 入口 | 主な操作例 |
| --- | --- | --- |
| 📚 案内 | `/help` | カテゴリ別ヘルプ |
| 🤖 AI | `/ai` | AIへ質問 |
| 👤 プロフィール | `/profile` | `view` `card` `level` `birthday` `streak` `achievements` `title-list` `title-equip` |
| 🪙 まぶP・経済 | `/economy` | `points` `gacha` `mission` `shop` `gift` |
| 🎮 ゲーム | `/play` | `game` `mystery` `quiz-*` `fishing-*` `race-*` `raid-*` `wolf-*` `reaction` |
| 💬 交流・統計 | `/community` | `hello` `topic` `idle` `thanks` `feedback` `match` `leaderboard` `digest` `weekly` `stats` `status` `note-*` `remind-*` `ticket-*` `announce` `analytics` |
| 🎉 イベント | `/event` | `event-*` `celebrate-*` `photo` `poll` |
| 📣 募集 | `/recruit` | `lfg` `vc` |
| 🛡️ 管理 | `/moderation` | `automod-*` `config-*` `modlog` |
| 🔊 ボイス | `/voice` | `tempvc-*` |

> 💡 まず `/help` を開けばOKです。Discordの入力補完からサブコマンドを選べます。
>
> 🔁 旧コマンド（`/points`、`/raid`、`/lfg` など）は公開登録から外し、統合後の入口へ移行しています。
> 🚀 コマンドを反映するときは `npm run deploy:commands` を実行してください。登録データ全体を置き換えるため、旧Commandの登録は公開側から削除されます。

---

## 🏗️ アーキテクチャ

```text
src/
├── index.ts                         # 🚪 エントリーポイント
├── bot.ts                           # 🤖 Discord Clientの初期化
├── env.ts                           # 🔐 環境変数
├── core/
│   ├── client/                      # 🧩 Command型・集約ルーティング
│   └── events/                      # 🔔 Discordイベントの入口
├── commands/                        # 🚪 公開Slash Command（10入口）
├── modules/                         # 🧱 機能別の内部実装
│   ├── ai/
│   ├── community/
│   ├── economy/
│   ├── events/
│   ├── fun/
│   ├── moderation/
│   ├── onboarding/
│   ├── profile/
│   ├── recruitment/
│   ├── social/
│   └── voice/
├── shared/                          # 🔁 共通処理
└── infrastructure/                  # 🗄️ DB・外部API・Storage
```

### 📐 設計ルール

- 🧩 コマンド処理は `src/modules/` の機能フォルダに置く
- 🎛️ CommandはDiscordとの入出力に集中させる
- 🧠 複雑な処理はServiceへ分離する
- 🗄️ DBアクセスはRepositoryへ集約する
- 🎨 EmbedやComponentの構築はViewへ分離する
- 🔌 外部APIやDBクライアントは `infrastructure/` に隔離する
- 🟦 アプリケーションコードはTypeScriptで統一する

新しい公開Slash Commandは `src/commands/` に追加してください。機能ロジックは `src/modules/` に置き、複数機能をまとめる場合は `command-aggregate.ts` を利用します。

---

## ⚙️ 環境変数

| 変数 | 必須 | 用途 |
| --- | :---: | --- |
| `DISCORD_TOKEN` | ✅ | BotログインToken |
| `DISCORD_CLIENT_ID` | ✅ | Discord Application ID |
| `DISCORD_GUILD_ID` | ◯ | 開発用Guildへ即時登録 |
| `MABUBOT_DATA_DIR` | ◯ | DB・画像の保存先。既定は `data/` |
| `FEEDBACK_CHANNEL_ID` | ◯ | 匿名Feedbackの転送先 |
| `BIRTHDAY_CHANNEL_ID` | ◯ | 誕生日告知先 |
| `DIGEST_CHANNEL_ID` | ◯ | 日次Digest投稿先 |
| `WELCOME_CHANNEL_ID` | ◯ | Welcome投稿先 |
| `TEMP_VC_CATEGORY_ID` | ◯ | 一時VCの作成先Category |
| `AI_API_KEY` | ◯ | OpenAI互換Chat Completions API Key |
| `AI_API_BASE_URL` | ◯ | API Base URL。既定はOpenAI API |
| `AI_MODEL` | ◯ | AIモデル名。既定は `gpt-4o-mini` |
| `LOG_LEVEL` | ◯ | `debug` / `info` / `warn` / `error`。既定は `info` |

> 🔒 `.env` はGitへコミットしないでください。TokenやAPI Keyはログ・Issue・公開ドキュメントにも載せないでください。

### 🖥️ コンソールログ

ログは時刻・レベル・領域・メッセージ・詳細情報の順で出力されます。

```text
2026-10-05T02:00:00.000Z INFO  [bot] 📋 コマンドを読み込みました {"count":10}
2026-10-05T02:00:01.000Z INFO  [command] ✅ 処理が完了しました {"command":"help","latencyMs":42,"guildId":"..."}
2026-10-05T02:00:03.000Z ERROR [command] ❌ 処理に失敗しました {"command":"ai","latencyMs":1200,"error":{"name":"Error","message":"AI_PROVIDER_ERROR_503"}}
```

通常運用は`LOG_LEVEL=info`、原因調査時は`LOG_LEVEL=debug`を使います。`debug`ではコマンド開始ログも表示されます。

---

## 🧪 開発者向けチェックリスト

変更を作ったら、次の順で確認してください。

```sh
# 1️⃣ 依存関係
npm ci

# 2️⃣ アプリとテストの型チェック
npm run typecheck
npm run typecheck:tests

# 3️⃣ 全テスト
npm test

# 4️⃣ 統合済み10コマンドのロード・シリアライズ確認
npm run verify:commands

# 5️⃣ 本番ビルド
npm run build
```

または、Makefileから一括実行できます。

```sh
make check
```

Windows で `make` を使わない場合は、次の npm コマンドを順番に実行してください。

```powershell
npm run typecheck
npm run typecheck:tests
npm test
npm run verify:commands
npm run build
```

### ✅ 現在の検証状況

- 🟦 TypeScript型チェック：アプリ本体・テストコードをCIで確認
- 🧪 自動テスト：`npm test`で実行
- 📋 Slash Command検証：コマンドの重複・description・ロードを確認
- 🔨 本番ビルド：`npm run build`で確認
- 🤖 GitHub Actions：Pull Requestと`main`へのPushで実行

### 🚨 CIが失敗したときの確認順

GitHub Actionsでは、**最初に失敗したステップ**から確認してください。後続ステップのエラーは連鎖している場合があります。

1. 🟢 **Node.js / npm**：Node.jsが想定バージョンか確認
2. 📦 **依存関係**：`npm ci`の最初の`npm ERR!`を確認
3. 🧹 **差分チェック**：`git diff --check`のファイル名・行番号を確認
4. 🧩 **型チェック**：最初の`error TSxxxx`を確認
5. 🧪 **テスト**：最初の`not ok`と、その直下のエラーを確認
6. 📋 **コマンド検証**：重複名やdescription不足を確認
7. 🔨 **ビルド**：最初のビルドエラーを確認

> 💡 **コツ**
>
> ログ全体を最初から読む必要はありません。
> **「最初の失敗ステップ → 最初の具体的なエラー → ファイル名と行番号」**の順に追うと、原因を切り分けやすくなります。

---

## 🔐 Discord側で必要な設定

### Gateway Intent

| Intent | 使用機能 |
| --- | --- |
| Guilds | Slash Command、Guild/Channel情報 |
| Guild Members | Member取得、Temp VC作成者確認 |
| Guild Presences | `/community status`のOnline人数 |
| Guild Voice States | VC人数、一時VCのJoin/Leave監視 |
| Message Content | AutoModの禁止語監視 |

### 主なBot権限

- 💬 View Channels / Send Messages
- 🖼️ Embed Links / Read Message History
- 🔊 Connect / Move Members
- 🛠️ Manage Channels / Manage Messages
- 📜 View Audit Log
- 🏠 Manage Guild

> ⚠️ 全権限を一括付与せず、使う機能に必要な権限だけを付与してください。

---

## 💾 データ保存

```text
$MABUBOT_DATA_DIR/
├── mabubot.sqlite                  # 🗄️ SQLite DB
└── images/                         # 🖼️ Photo画像
```

`MABUBOT_DATA_DIR` 未設定時は、作業ディレクトリ内の `data/` が使われます。本番では固定の絶対パスを指定してください。

```dotenv
MABUBOT_DATA_DIR=/srv/mabubot/data
```

> 💡 SQLiteは同期処理です。複数Botプロセスで同じDBを共有したり、ネットワーク共有Filesystemへ置いたりしないでください。

---

## ⏰ 定期Job・自動処理

時刻は日本時間（`Asia/Tokyo`）です。

| Job | タイミング | 条件 |
| --- | --- | --- |
| 🎂 Birthday | 毎日09:00〜09:05 | `BIRTHDAY_CHANNEL_ID`設定時 |
| 📰 Digest | 毎日09:05〜09:10 | `DIGEST_CHANNEL_ID`設定時 |
| ⏳ Event Reminder | Event開始15分前のWindow | リマインダー未送信の対象Event |
| 🧹 Temp VC Cleanup | Voice State Update・Bot起動時 | DB記録とGuild Channelを照合 |

---

## 📚 ドキュメント

- 📋 [機能計画書](docs/feature-plan.md)
- 🏗️ [アーキテクチャ設計書](docs/architecture.md)
- 🛠️ [導入・運用ガイド](docs/operations.md)
- 💡 [追加機能・統合案](docs/feature-ideas.md)

---

## ⚠️ 現在の制約

- `/economy mission claim:true` は達成の自己申告です
- `/community status` のOnline人数はPresence IntentとCache状態に依存します
- `/ai` はGuild/User単位で直近10メッセージをDBへ保存します
- Photo画像に保持期限はありません
- Feedback、Birthday、Digestの宛先は環境変数単位で、Guildごとの設定には未対応です

---

## 🤝 開発・コントリビュート

1. 🌿 ブランチを作成
2. ✍️ TypeScriptで変更を実装
3. 🧪 `make check` を実行
4. 📝 変更内容を説明してPull Requestを作成

質問・改善案・バグ報告はIssueへお願いします。


## 🧪 自動テストのSQLite設定

`node:sqlite` を利用するテストのため、`npm test` はクロスプラットフォームの `scripts/run-tests.mjs` から Node.js に `--experimental-sqlite` を渡します。Windows / PowerShell と CI で同じ実行条件になります。

---

## 🗃️ SQLite CIトラブルシューティング

`node:sqlite` が `ERR_UNKNOWN_BUILTIN_MODULE` で失敗した場合は、Node.js 22.16系では SQLite の実験機能フラグ `--experimental-sqlite` が必要です。`npm test` がこのフラグを自動的に有効化します。

## 📝 コードコメント方針

統合後のコードでは、処理内容の単純な言い換えではなく「なぜこの実装なのか」を残します。TypeScript各ファイルには役割を1行で示すモジュールコメントを置き、追加コメントは統合境界・互換契約・永続化やCIの非自明な制約に限定します。

- 🧩 統合ルーター: 公開10コマンドと旧Command実装の境界（47個を互換利用、旧Help 1個は置換）
- 🔁 互換層: 旧Commandの入力契約を維持する理由
- 🗃️ SQLite: Node.jsの実行条件、共有接続、スキーマ保護
- 🧪 CI/検証: 失敗条件を先に検出する理由

単純な `if`・代入・ループ・`return` の逐語説明や、同じ責務を関数ごとに繰り返すコメントは追加しません。機能コードをコメント化して無効にする「コメントアウト」も行いません。詳細は [`docs/comment-guidelines.md`](./docs/comment-guidelines.md) を参照してください。
