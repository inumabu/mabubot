# 🏗️ まぶBot アーキテクチャ設計

まぶBotは、**Discordとの境界を薄く保ち、機能単位のモジュールとRepositoryで拡張するTypeScript製Bot**です。

> 🎯 **設計のゴール**
>
> 小さな機能は小さく実装し、状態・権限・外部API・DBアクセスが増えたときだけ適切な境界を追加します。

---

## 🧭 全体方針

- 🧩 1機能の処理は、その機能フォルダに置く
- 🗄️ DBアクセスはRepositoryへ集約する
- 🎨 Embed・Button・Select・Modal構築はViewへ分離する
- 🔌 外部APIは`infrastructure/`に隔離する
- 🔁 複数機能から使うものだけを`shared/`に置く
- 🚫 巨大な`commands.ts`や汎用`utils.ts`を作らない
- 🟦 アプリケーションコードはTypeScriptで統一する

---

## 🧱 モジュール境界

| Module | 公開入口 | 役割 |
| --- | --- | --- |
| 👋 Onboarding | `/help` `/community hello` | 初回案内・ヘルプ |
| 💬 Social | `/community ...` | 会話・感謝・フィードバック |
| 🤖 AI | `/ai` | AI応答 |
| 👤 Profile | `/profile ...` | プロフィール・実績・称号 |
| 🪙 Economy | `/economy ...` | まぶP・ショップ・報酬 |
| 🎮 Fun | `/play ...` | ミニゲーム・釣り・レイド |
| 🎉 Events | `/event ...` | イベント・投票・写真 |
| 📣 Recruitment | `/recruit ...` | ゲーム・VC募集 |
| 🛡️ Moderation | `/moderation ...` | 管理・AutoMod・設定 |
| 🔊 Voice | `/voice ...` | 一時Voice Channel |

---

## 📁 標準的な機能構成

```text
feature/
├── feature.command.ts       # 🎛️ Discord入力・権限・応答
├── feature.service.ts       # 🧠 ユースケース・業務ロジック
├── feature.repository.ts    # 🗄️ 永続化・SQL
├── feature.view.ts          # 🎨 Embed・Component
├── feature.schema.ts        # ✅ 入力スキーマ（必要な場合）
└── feature.types.ts         # 🏷️ 型定義（必要な場合）
```

### 🔄 呼び出しの流れ

```text
Discord Interaction
        ↓
Command（入力・権限確認）
        ↓
Service（ユースケース）
        ↓
Repository / Facade / Infrastructure
        ↓
SQLite・外部API・Discord応答
```

> 💡 小規模な機能では、必要な層だけを作ります。すべての機能に全ファイルを用意する必要はありません。

---

## 🔗 機能間連携

Economyの更新はFacadeを経由させ、他機能からEconomy RepositoryやSQLを直接呼ばない方針です。

```text
LFG参加
  ↓
EconomyFacade
  ↓
Points / Inventory / Mission
```

将来的には、次のドメインイベントを発行してXP・Points・Mission・Streak・Statisticsへ連携する構想があります。

- `LFGJoined`
- `GamePlayed`
- `EventJoined`
- `ThanksReceived`
- `VcJoined`
- `DailyLogin`

> 🧪 これは将来拡張です。現状は既存のService・Facade・Repository連携を使用しています。

---

## 👤 UserとGuild設定

- 👤 UserはProfile、Economy、Socialの共通識別子として扱う
- 🏠 Guild固有の設定値は現在`guild_settings`へ保存し、将来的に`GuildConfig`へ集約する
- 🚫 機能ごとに重複したユーザー情報を持たない

想定する永続データ：

概念上のデータ：`User`、`GuildConfig`、`PointTransaction`、`UserBalance`、`UserLevel`、`UserTitle`、`Birthday`、`UserStreak`、`LfgPost`、`LfgMember`、`Event`、`EventMember`、`Poll`、`Mission`、`Inventory`、`Gift`、`GameStats`、`Feedback`、`ModerationLog`、`TempVoiceChannel`、`DailyDigest`。実装上のSQLiteテーブル名は`infrastructure/database/sqlite.ts`を正とする。

---

## 📝 コメント記述ルール

統合ルーターと旧機能の互換層では、コメントを「処理の説明」ではなく、**公開Commandと内部機能の境界・Discord.jsのBuilder契約・旧Commandとの互換性**を説明する目的で記述します。詳細は [`docs/comment-guidelines.md`](./comment-guidelines.md) を参照してください。

## 🖱️ Interaction RouterとJobs

`core/events/interaction-create.ts`を入口に、次のInteractionを機能別Handlerへ振り分けます。

- 💬 Slash Command
- 🔘 Button
- 📑 Select Menu
- 📝 Modal Submit
- ✨ Autocomplete

未登録ComponentにはEphemeral応答を返し、Handler例外は共通エラー応答へ変換します。

### ⏰ 定期処理

`src/jobs/`で次の処理を管理します。

- 🎯 日次ミッション
- 🎂 誕生日告知
- 📰 Digest
- 🔔 イベントリマインダー
- 🧹 一時VC掃除

---

## 🛡️ PermissionとGateway Intent

通常利用に必要な権限は、View Channels、Send Messages、Embed Links、Read Message Historyです。

機能追加時は、必要な権限とGateway Intentを次の両方へ反映します。

1. 💻 Command側の権限チェック
2. 🌐 Discord Developer PortalのBot設定
3. 📚 README / 運用ガイド
4. 🧪 権限境界のテスト

---

## 🗂️ 実装ファイルの例

```text
src/modules/
├── recruitment/
│   ├── lfg/lfg.command.ts
│   ├── vc/vc.command.ts
│   ├── recruitment.repository.ts
│   ├── recruitment.service.ts
│   ├── recruitment.view.ts
│   └── recruitment.buttons.ts
├── economy/
│   ├── economy.facade.ts
│   ├── economy.repository.ts
│   ├── points/points.command.ts
│   ├── gacha/gacha.command.ts
│   ├── mission/mission.command.ts
│   ├── shop/shop.command.ts
│   └── gift/gift.command.ts
└── profile/
    ├── profile.repository.ts
    ├── profile.service.ts
    ├── profile.view.ts
    └── {level,title,birthday,profile,streak,card}/
```

`BotCommand`はカテゴリ、Slash Command Builder、`execute()`、任意のAutocomplete/Component Handlerを持ちます。Command入口でGuild ID、Option、権限を検証してからServiceを呼び出します。

---

## 💾 保存先とMigration

`MABUBOT_DATA_DIR`がDBと写真の共通Rootです。

- 📍 相対値：`process.cwd()`基準
- 🏠 未設定時：`data/`
- 🗄️ DB：`mabubot.sqlite`
- 🖼️ 画像：`images/`

Schemaは`infrastructure/database/sqlite.ts`で起動時に初期化します。既存DBへの列追加は`PRAGMA table_info`で不足列を確認して`ALTER TABLE`します。

> ⚠️ 破壊的変更は自動実行しません。明示的なBackup / Migration手順を用意してください。

### 📋 主なテーブル

| 領域 | テーブル |
| --- | --- |
| 💬 Social / Recruitment | `idle_members` `recruitments` `recruitment_members` `thanks_records` |
| 📅 Events | `events` `event_members` `event_reminders` `photo_posts` `celebrations` |
| 💰 Economy | `point_balances` `point_transactions` `inventories` `daily_claims` |
| 🪪 Profile | `user_profiles` `user_titles` `birthday_announcements` |
| 🎮 Community / AI / Voice | `ai_conversations` `temp_voice_channels` `number_game_sessions` |
| 📨 Feedback / Jobs | `feedback_entries` `daily_job_runs` |

残高、購入、送金、日次受取、Streak報酬、募集参加枠は`BEGIN IMMEDIATE`と`ROLLBACK`で原子性を保ちます。

> 🚫 SQLite APIは同期実行です。DBファイルは単一Botプロセスで運用し、ネットワーク共有Filesystemへ置かないでください。

---

## 🧪 テスト境界

- 🗄️ Repositoryへ`:memory:`の`DatabaseSync`を注入する
- 💰 参加枠、二重claim、送金、在庫移動、Streak rollbackをテストする
- 🤖 AI履歴がGuild/Userごとに分離されることをテストする
- 📋 `loadCommands()`で10個の公開Command名と登録用JSONを検証する
- 🖱️ Select / Modal / Embed表示上限を回帰テストする
- 🔄 DB列Migrationを回帰テストする
- 🌐 Discord REST、Audit Log、Gateway Intent、AI Provider、Channel送信はIntegration環境で確認する

---

## 🔒 データ保持

ポイント取引、Thanks、Feedback、AI会話、Photo、募集・イベントなどを保存します。

- 🤖 AI履歴：Guild/Userごとに直近10メッセージ
- 🖼️ Photo：現在は保持期限なし
- 💬 その他履歴：運用者が保持期間を決める
- 💾 Backup：DBと画像を同じ時点で取得する

---

## 🪜 将来の拡張

| 拡張案 | 状態 |
| --- | --- |
| GuildConfigによるGuild別設定 | 📝 未実装 |
| Domain Event Bus | 📝 未実装 |
| 会話・VC参加からのXP/統計 | 📝 未実装 |
| Schedulerライブラリ | 📝 未実装 |
| 独自ModerationLog | 📝 未実装 |
| Prisma移行 | 📝 未実装 |

> ✅ 拡張時は、設計書・DB Migration・機能テストを同じ変更で更新します。
