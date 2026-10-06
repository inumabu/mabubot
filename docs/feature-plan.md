# 📋 まぶ鯖専属Bot 機能計画

まぶ鯖で **遊ぶ・話す・人とつながる** きっかけを作るための機能カタログです。

> 🎯 **読み方**
>
> まず一覧で全体像を確認し、必要なコマンドの詳細仕様・副作用・制約を下のリファレンスで確認してください。

---

## 🗺️ ドキュメント構成

1. 🎮 [統合後の10コマンド](#-統合後の10コマンド)
2. 🧩 [Coreコマンド仕様](#-coreコマンド仕様)
3. 📚 [その他の機能メモ](#-その他の機能メモ)
4. 🪜 [開発優先順位](#-開発優先順位)
5. 🧾 [Commandリファレンス](#-commandリファレンス)
6. 📌 [機能上のポリシー・制約](#-機能上のポリシー制約)
7. ✅ [開発時のDone条件](#-開発時のdone条件)


## 🎯 コンセプト

便利さだけでなく、まぶ鯖で遊ぶ・話す・人とつながるきっかけを作るBotを目指す。

コマンド名と管理コマンドは英語、応答とEmbedは日本語に統一する。Buttonのラベルは日本語でもよい。コマンド名は短く、意味が伝わるものにする。

## 🎮 統合後の10コマンド

48個の旧Slash Command実装を、目的別の10個へ統合しています。内部の機能は削除せず、サブコマンドから利用します。

| # | 公開入口 | 主な機能 |
| ---: | --- | --- |
| 01 | `/help` | 使い方・カテゴリ案内 |
| 02 | `/ai` | AI応答 |
| 03 | `/profile ...` | プロフィール・実績・称号 |
| 04 | `/economy ...` | まぶP・ショップ・ガチャ・ミッション・ギフト |
| 05 | `/play ...` | ゲーム・釣り・レース・レイド |
| 06 | `/community ...` | 交流・統計・FAQ・リマインダー・チケット |
| 07 | `/event ...` | イベント・記念日・投票・写真 |
| 08 | `/recruit ...` | ゲーム・VC募集 |
| 09 | `/moderation ...` | AutoMod・設定・監査ログ・告知 |
| 10 | `/voice ...` | 一時VC |

### 🔁 旧コマンドからの主な移行

| 旧入口 | 新入口 |
| --- | --- |
| `/points` | `/economy points` |
| `/shop` | `/economy shop` |
| `/title list` | `/profile title-list` |
| `/game` | `/play game` |
| `/fishing cast` | `/play fishing-cast` |
| `/raid status` | `/play raid-status` |
| `/lfg` | `/recruit lfg` |
| `/event create` | `/event event-create` |
| `/config show` | `/moderation config-show` |

## 🧩 Core・内部機能仕様

### `/community idle`

「今暇」な状態を登録・解除する。ゲーム・雑談・VCの募集状況と参加人数を表示し、活動ごとの参加ボタンを提供する。

### `/recruit lfg`

ゲーム名、募集人数、開始時刻、メモを指定して募集を作成する。募集EmbedにJoin/Leave操作を付け、ゲーム名はAutocompleteに対応する。

### `/recruit vc`

雑談・ゲームなどの活動内容と参加上限を指定してVC参加者を募集する。任意の参加先VCを指定すると、参加者ボタンとVCへ移動するButtonを表示する。

### `/community topic`

`random`、`games`、`music`、`daily`、`fun` からカテゴリを選び、雑談のお題をランダムに表示する。

### `/community status`

Online、VC参加者、LFG、Idle、次のイベントをまとめて表示する。

### `/event event-*`

イベントを作成・一覧・参加・キャンセルできる。作成後は参加状態を管理する。

### `/event poll`

サーバー内で投票・アンケートを作成する。

## 📚 その他の機能メモ

- `/help` はカテゴリ別に表示し、全コマンドを一度に詰め込まない。
- `/play game` は `rps`、`number`、`quiz`、`dice` を選択して遊べます。
- `/economy points`、`/profile level`、`/profile title-*`、`/profile view`、`/profile streak`、`/profile card` は同じユーザー情報を中心に連携する。
- `/community feedback` は要望、バグ報告、改善案、困りごとを匿名で運営へ送る。
- `/moderation modlog` はDiscord Audit Logを権限のあるメンバーが確認する。
- `/voice tempvc-create` は一時VCを作成し、空になったチャンネルを削除する。
- `/ai` はGuild/User単位の会話コンテキストを使い、外部AIプロバイダーから分離する。FAQ・ルールの登録機能は未実装です。
- `/community digest` は募集、VC、イベント、Thanks、Idle、レイドHPなど現在保存している活動をまとめます。
- `/community leaderboard` はまぶP、XP、連続ログイン、ゲーム勝利数をGuild単位で上位表示する。
- `/play mystery` は日付ごとに変わる問題を1日1回判定し、正解報酬をまぶPへ加算する。
- `/play quiz-*` はサーバー単位の10分間クイズ、`/play wolf-*` は参加・役割確認・投票の短時間ゲームとして利用できます。
- `/moderation config welcome` はGuildごとにWelcomeタイトル、本文、DMチュートリアルを変更し、`/moderation config welcome-reset`で初期値へ戻す。
- `/community analytics` はSlash Commandの成功/失敗、実行時間、利用回数を直近90日まで集計する。
- `/play reaction` はButtonの先着判定、`/play race-*` は走者予想、`/play fishing-cast`、`/play fishing-book` は魚Inventoryと図鑑、`/play raid-*` は日次共有HPを使う。

## 🪜 開発優先順位

機能計画書の優先順位を採用する。アーキテクチャ設計書には異なるPhase分割案もあるため、Phase番号ではなく以下の機能順を基準にする。

### 1️⃣ Phase 1：日常利用

`/community hello`、`/help`、`/community topic`、`/community idle`、`/recruit lfg`、`/recruit vc`、`/event event-create`、`/event poll`

### 2️⃣ Phase 2：コミュニティと経済

`/community thanks`、`/economy points`、`/profile level`、`/profile title-*`、`/profile view`、`/profile streak`、`/economy gacha`、`/economy mission`、`/play game`、`/profile card`、`/economy shop`、`/economy gift`

### 3️⃣ Phase 3：まぶ鯖専用機能

`/event photo`、`/profile birthday`、`/community status`、`/community match`、`/ai`、`/community digest`、`/moderation modlog`、`/community feedback`、`/voice tempvc-create`、`/event celebrate-*`

## 🧾 Commandリファレンス

ここではDiscord上で現在登録される入力と応答を記載する。`?`は任意Option。選択肢の実際の表示/必須条件はDiscord UIが定義する。

| Command | 入力 | 動作・副作用 |
| --- | --- | --- |
| `/community hello` | なし | 日本語の歓迎と`/help`案内を返す |
| `/help` | `category?` | カテゴリ概要、またはカテゴリ内Command一覧をEphemeral表示 |
| `/community topic` | `category?` | 指定カテゴリからお題を1つ選んで返信 |
| `/community idle` | なし | GuildのIdle Boardを表示。Buttonでゲーム/雑談/VC登録と解除 |
| `/recruit lfg` | `game`, `members`, `time?`, `note?` | 募集をDB保存。gameはAutocomplete、membersは主催者込み2〜20人 |
| `/recruit vc` | `activity`, `limit?`, `channel?` | 雑談/ゲーム募集をDB保存。任意Channel指定時はVC移動Linkを表示 |
| `/event event-create` | `name`, `starts_at`, `description?` | 未来のISO 8601日時で作成。参加/退出/主催キャンセルButtonを表示 |
| `/event event-list` | なし | 直近15件の未来イベントをEphemeral表示 |
| `/event poll` | `question`, `choices` | `|`区切り2〜10選択肢、Discord標準24時間Pollを投稿 |
| `/community thanks` | `user`, `message?` | ThanksをDB記録し相手へ返信。本人/Bot宛は禁止 |
| `/event photo` | `image?`, `caption?` | 画像ありで保存・投稿、なしで今日の投稿を表示 |
| `/economy points` | `user?`, `claim?` | 残高照会、または1日1回+15まぶP |
| `/profile level` | `user?` | XPとLevelを表示 |
| `/profile title-list` | なし | 所持称号を表示 |
| `/profile title-equip` | `title` | 所持称号のみ装備可能 |
| `/profile birthday` | `date?`, `clear?` | `MM-DD`登録/確認/削除。年は取得・保存しない |
| `/profile view` | `user?` | Level、XP、まぶP、称号、Streak、Thanks、所持数を表示 |
| `/profile streak` | `checkin?` | 日数照会、または+25 XP/+5まぶPの当日記録 |
| `/economy gacha` | なし | 50まぶP消費し、抽選アイテムをInventoryに追加 |
| `/economy mission` | `claim?` | 日替わりミッションを表示、または1日1回+50まぶPを受取 |
| `/play game` | `type`, `choice?`, `guess?` | じゃんけん/サイコロ/数字当て/クイズ。クイズは初回出題、次回choiceで回答（10分有効） |
| `/profile card` | `user?` | Profile情報と所持アイテムをカード表示 |
| `/economy shop` | `buy?` | 商品一覧、またはまぶPで購入 |
| `/economy gift` | `user`, `points?`, `item?` | まぶPまたはアイテムの一方を贈る |
| `/community status` | なし | Online/VC/LFG/Idle/次イベントをGuild CacheとRepositoryから集計 |
| `/community leaderboard` | `metric`, `limit?` | まぶP・XP・連続ログイン・ゲーム勝利数を上位10人まで表示 |
| `/community match` | `type` | Idle User、ゲーム時はLFG募集を最大表示件数内で表示 |
| `/ai` | `prompt` | OpenAI互換APIへ問い合わせ、User/Guildの直近会話を参照・保存 |
| `/community digest` | なし | 今日の募集/イベント/Thanks/レイドHP等を表示。手動実行も可能 |
| `/moderation modlog` | `user?`, `limit?` | Audit Logを最大10件表示。View Audit Log権限必須 |
| `/community feedback` | `category`, `message` | 運営Channelへ投稿者IDを含めず転送・保存 |
| `/voice tempvc-create` | `name?`, `limit?` | 実行者を新しいVoice Channelへ移動。無人時削除 |
| `/event celebrate-create` | `title`, `starts_at`, `description?` | Manage Guild権限で記念日登録 |
| `/event celebrate-list` | なし | 将来の記念日をEphemeral表示 |
| `/play mystery` | `answer?` | 今日の問題を表示、または正解時に1日1回+25まぶP |
| `/play quiz-start` | なし | サーバーに10分有効の問題を出題 |
| `/play quiz-answer` | `text` | 出題済みの問題を判定 |
| `/play wolf-start` / `wolf-join` / `wolf-role` / `wolf-vote` | `user?` | ロビー参加、個人役割確認、全員投票で勝敗判定 |
| `/play reaction` | なし | Buttonの正解者に+20まぶP |
| `/play race-start` / `race-pick` | `racer?` | 4走者の勝者を予想し、的中者に+30まぶP |
| `/play fishing-cast` / `/play fishing-book` | なし | 30秒に1回釣り、魚をInventoryへ追加し+3〜50まぶP。bookで魚図鑑を表示 |
| `/play raid-status` / `/play raid-attack` | なし | 日次HP1000のボスを協力攻撃し、攻撃+5・討伐ボーナス+50まぶP |

## 📌 機能上のポリシー・制約

- **Poll**：複数回答なし、24時間、Discord標準Poll API。結果はDiscord側で管理する。
- **Photo**：Discord添付をBot側Filesystemへコピーする。`MABUBOT_DATA_DIR/images`のバックアップ/容量管理が必要。
- **Points**：日次受取、Streak、Shop、Gacha、GiftをRepositoryトランザクションで管理する。通常会話だけでXP/Pointsを自動加算する処理はない。
- **Mission**：日付から固定リストを選び、報酬の受取は自己申告。達成検証はしない。
- **AI**：会話履歴はGuild/User単位で直近10メッセージ。FAQやGuild設定を外部DBから取得する仕組みはまだない。
- **Modlog**：現状はDiscord Audit Log照会。Bot独自の警告/処分履歴Repositoryはまだない。
- **Digest**：募集件数等の現在保存している活動を集計する。VC滞在時間や人気Topic分析は未実装。
- **VC募集とTemp VC**：別機能。`/recruit vc`は募集投稿、`/voice tempvc-create`はChannel生成。

## ✅ 開発時のDone条件

1. Command Optionと日本語応答を機能計画へ記載する。
2. 状態を持つ場合はRepositoryと重複/権限/期限のテストを追加する。
3. Embed/ComponentはDiscord上限を超えない表示件数にする。
4. 非同期Discord/API処理は初回応答を3秒以内に返すか、先にdeferする。
5. `npm run typecheck`、`npm run typecheck:tests`、`npm test`、`npm run verify:commands`、`npm run build`を通す。
