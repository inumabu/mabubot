# 🧭 コマンド統合方針

従来の48個のSlash Command実装は、利用者向けの入口を10個へ集約しました。47個は互換層として集約Commandから再利用し、旧Help実装は新しい公開 `/help` に置き換えています。内部のサービス・Repositoryは維持します。

## 📚 公開入口

- `/help`：使い方
- `/ai`：AI
- `/profile ...`：プロフィール、実績、称号
- `/economy ...`：まぶP、ショップ、ガチャ、ミッション、ギフト
- `/play ...`：ゲーム、釣り、レース、レイド、ワードウルフ
- `/community ...`：交流、募集状況、統計、運営ツール
- `/event ...`：イベント、記念イベント、写真、投票
- `/recruit ...`：ゲーム募集、VC募集
- `/moderation ...`：AutoMod、設定、監査ログ
- `/voice ...`：一時VC

## 🔁 移行例

`/points` → `/economy points`
`/raid status` → `/play raid-status`
`/lfg` → `/recruit lfg`
`/title list` → `/profile title-list`
`/event create` → `/event event-create`
`/config show` → `/moderation config-show`

## 📝 コメントのルール

統合ルーター・互換層では、**公開ルートの目的、既存契約、Builder制約、旧Command再利用の理由**をコメントに残します。単純な処理の説明は省略し、業務ロジックは互換層へ追加しません。詳細は [`docs/comment-guidelines.md`](./comment-guidelines.md) を参照してください。

## ✅ 設計上のルール

公開Slash Commandは `src/commands/` に置き、1入口あたりのサブコマンドはDiscordの上限を超えないようにします。機能実装は `src/modules/` に残し、UIだけを集約します。

## 🚀 Discordへの反映

統合後は `npm run deploy:commands` を実行してください。デプロイ処理は公開Command一覧を丸ごと置き換えるため、旧Commandの登録は対象から外れます。開発中は `DISCORD_GUILD_ID` を指定してGuildコマンドとして確認するのがおすすめです。
