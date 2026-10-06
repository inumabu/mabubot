# 🛠️ まぶBot 導入・運用ガイド

このページでは、Discord Applicationの準備から起動・バックアップ・トラブルシューティングまでを説明します。

> ✅ **対象環境**
>
> まぶBotはNode.js上で動くTypeScriptアプリケーションです。実行に必要なのはNode.js、npm、Discord Application、保存用Filesystemです。

---

## 1️⃣ 必要環境

- 🟢 Node.js **22.16以降**（Node標準の`node:sqlite`を使用）
- 📦 npm
- 🤖 Discord ApplicationとBot Token
- 💾 DB・画像を保持できるローカルFilesystem

バージョン確認：

```sh
node --version
npm --version
```

---

## 2️⃣ Discord Applicationの準備

1. 🌐 [Discord Developer Portal](https://discord.com/developers/applications)でApplicationを作成
2. 🤖 Botを追加し、Tokenを発行
3. 🆔 Application ID（Client ID）を控える
4. 🔐 Privileged Gateway Intentsを必要に応じて有効化
5. 🔗 OAuth2 URL Generatorで`bot`と`applications.commands`を選び、BotをGuildへ招待
6. 🛡️ 下記の権限を必要な機能に応じて付与

> 🔒 **Tokenの注意**
>
> Bot TokenはGit、ログ、Issue、公開ドキュメントに含めないでください。

### 📡 Gateway Intent

| Intent | 用途 |
| --- | --- |
| `Guilds` | Slash Command、Guild/Channel情報 |
| `Guild Members` | Member取得、Temp VC作成者の確認 |
| `Guild Presences` | `/community status`のOnline人数 |
| `Guild Voice States` | VC人数、一時VCのJoin/Leave監視 |
| `Message Content` | AutoModの禁止語監視 |

`Message Content Intent` はAutoModを使う場合に必要です。Privileged Intentの利用条件はDiscord Developer Portalの設定に従ってください。

### 🛡️ Bot Permissions

| 権限 | 使用する機能 |
| --- | --- |
| `View Channels` / `Send Messages` | Command応答とChannel投稿 |
| `Embed Links` / `Read Message History` | Embed表示、履歴確認 |
| `Connect` / `Move Members` | Voice Channelへの接続・移動 |
| `Manage Channels` | Temp VCの作成・削除 |
| `View Audit Log` | `/moderation modlog` |
| `Manage Guild` | `/event celebrate-create` |
| `Manage Messages` | `/moderation automod-*`、`/community announce` |

> ⚠️ 全権限を一括付与せず、使う機能に必要な権限だけを付与してください。

---

## 3️⃣ インストールと環境変数

```sh
# 📦 依存関係をインストール
npm ci

# 📝 設定ファイルを作成
cp .env.example .env
```

### 🔐 環境変数一覧

| 変数 | 必須 | 説明 |
| --- | :---: | --- |
| `DISCORD_TOKEN` | ✅ | BotログインToken |
| `DISCORD_CLIENT_ID` | ✅ | Discord Application ID |
| `DISCORD_GUILD_ID` | ◯ | 設定するとGuild Commandへ登録。未設定はGlobal Command |
| `MABUBOT_DATA_DIR` | ◯ | DB・画像保存先。既定は作業ディレクトリ内の`data/` |
| `FEEDBACK_CHANNEL_ID` | ◯ | 匿名Feedbackの転送先Text Channel |
| `BIRTHDAY_CHANNEL_ID` | ◯ | 誕生日告知先Text Channel |
| `DIGEST_CHANNEL_ID` | ◯ | 日次Digest投稿先Text Channel |
| `WELCOME_CHANNEL_ID` | ◯ | Welcome投稿先。未設定時はGuildのSystem Channel |
| `TEMP_VC_CATEGORY_ID` | ◯ | Temp VC作成先Category |
| `AI_API_KEY` | ◯ | OpenAI互換Chat Completions API Key |
| `AI_API_BASE_URL` | ◯ | API Base URL。既定は`https://api.openai.com/v1` |
| `AI_MODEL` | ◯ | Model名。既定は`gpt-4o-mini` |
| `LOG_LEVEL` | ◯ | `debug` / `info` / `warn` / `error`。既定は`info` |

> 🔒 `.env` はGit管理対象外です。秘密情報を公開リポジトリへコミットしないでください。

---

## 4️⃣ Command登録と起動

### 📋 Slash Commandを登録

開発中はGuild Command登録が反映の速い方法です。

```sh
npm run deploy:commands
```

`DISCORD_GUILD_ID` があればGuild登録、なければGlobal登録になります。登録スコープを切り替えた場合は、前のScopeに登録済みCommandが残っていないか確認してください。

### 🖥️ コンソールログの見方

ログは次の形式で出力されます。

```text
日時                 LEVEL [領域] メッセージ {詳細JSON}
2026-10-05T02:00:01Z INFO  [command] completed {"command":"help","latencyMs":42}
```

| レベル | 用途 |
| --- | --- |
| `DEBUG` | 処理開始など、原因調査用の詳細ログ |
| `INFO` | 起動、コマンド完了、Job完了など通常運用の状態 |
| `WARN` | リトライ可能・要確認の状態 |
| `ERROR` | 処理失敗、例外、外部APIエラー |

通常は`LOG_LEVEL=info`、障害調査時だけ`LOG_LEVEL=debug`にします。ログにはTokenやAPI Keyを出力しません。

### 🧪 開発起動

```sh
npm run dev
```

ファイル変更を監視しながら起動します。

### 🚀 本番起動

```sh
npm run build
npm start
```

---

## 5️⃣ 永続データとバックアップ

保存先は次の構成です。

```text
$MABUBOT_DATA_DIR/
├── mabubot.sqlite                  # 🗄️ SQLite DB
└── images/                         # 🖼️ Photo画像
```

`MABUBOT_DATA_DIR` はプロセスの作業ディレクトリ基準です。本番では固定の絶対パスを指定してください。

```dotenv
MABUBOT_DATA_DIR=/srv/mabubot/data
```

### 💾 バックアップ手順

- ⏹️ バックアップ時はBotを停止する
- 📁 DBと`images/`を同じ時点でコピーする
- 🔁 復元時もDBと画像を同じバックアップから戻す
- 🚫 `data/`をGit管理に追加しない
- 🧱 複数Botプロセスで同じSQLite DBを共有しない

> 💡 SQLiteは同期処理です。ネットワーク共有Filesystemへの配置も避けてください。

---

## 6️⃣ 定期Job

時刻は日本時間（`Asia/Tokyo`）です。

| Job | 実行タイミング | 条件 |
| --- | --- | --- |
| 🎂 Birthday | 毎日09:00〜09:05 | `BIRTHDAY_CHANNEL_ID`設定時 |
| 📰 Digest | 毎日09:05〜09:10 | `DIGEST_CHANNEL_ID`設定時 |
| ⏰ Event Reminder | Event開始15分前の15分Window | Eventが送信済みChannel/Message IDを持つ |
| 🧹 Temp VC Cleanup | Voice State Update、Bot起動時 | DB記録とGuild Channelを照合 |

日次JobはDBに実行日を保存して重複を避けます。Bot停止中に時間帯を過ぎると、Birthday/Digestは当日中に追送されません。起動後は1分ごとにJobを確認します。

---

## 7️⃣ テスト・ビルド

### ✅ 一括チェック

```sh
make check
```

### 🔍 個別チェック

```sh
# 🟦 アプリの型チェック
npm run typecheck

# 🟪 テストコードの型チェック
npm run typecheck:tests

# 🧪 テスト実行
npm test

# 📋 10個の公開Commandの登録データ確認
npm run verify:commands

# 🔨 本番ビルド
npm run build
```

テスト対象にはRepositoryのトランザクション、DB migration、ランキング検索、Embed長制限、ゲーム状態、Select/Modal Router、AI API境界、10個の公開Commandの登録データ生成が含まれます。

---

## 8️⃣ 現在の機能制約

- 📝 `/economy mission claim:true` は達成の自己申告で、活動イベントによる自動検証はしません
- 👀 `/community status` のOnline人数はPresence Intentと起動後のCache状態に依存します
- 🤖 `/ai` はGuild/User単位で直近10メッセージをDBに保存します
- 🕒 Photo画像に保持期限はありません
- 📮 Feedbackは匿名で転送・保存しますが、内容や投稿時刻から本人を推測できる可能性があります
- 🏠 Feedback、Birthday、Digestの宛先は環境変数単位で、Guildごとの設定には未対応です

---

## 9️⃣ トラブルシューティング

| 症状 | 確認する点 |
| --- | --- |
| 🚫 起動時に環境変数エラー | `.env`のToken、Client ID、dotenv読み込み |
| 🫥 Slash Commandが表示されない | `npm run deploy:commands`、登録先Guild、Application ID、招待Scope |
| 👥 StatusのOnlineが少ない/0 | Developer PortalのPresence Intent、再接続後のCache |
| 🔊 Temp VCを作れない | 実行者がVoice参加中か、Category ID、Manage Channels/Move Members |
| 📜 Modlogを見られない | 実行者とBotのView Audit Log権限 |
| 📣 Feedback/告知が届かない | Channel ID、Guild所属Text Channel、BotのView/Send/Embed権限 |
| 🤖 AI応答がない | API Key、Base URL、Model、外部接続、API利用制限 |
| 💾 再デプロイ後にDBが見つからない | `MABUBOT_DATA_DIR`、作業ディレクトリ、永続Volume |

---

## 🔗 関連ドキュメント

- 📖 [README](../README.md)
- 🏗️ [アーキテクチャ設計書](architecture.md)
- 📋 [機能計画書](feature-plan.md)
- 💡 [追加機能・統合案](feature-ideas.md)
