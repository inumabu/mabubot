# 🔎 全ファイル見直し記録（2026-10-05）

## ✅ 対象

`src/`、`tests/`、`scripts/` 配下のTypeScript 122ファイルと、CI・設定・主要ドキュメントを横断確認しました。

## 🧩 統合ルーター

- 公開入口は10個、旧Command実装は48個を維持。
- 47個は互換マウントし、旧Help実装は新しい公開 `/help` に置き換えています。したがって「48」は旧Command実装の総数であり、互換マウント数は47です。
- Slash Command / Autocompleteの両方で、旧Commandが従来のSubcommand名を受け取れる互換ビューを使用します。
- Discord.js Builder callbackは対象Builderを返す契約を維持します。

## 🔁 互換層

互換層は入力・実行契約の維持に限定し、業務ロジックを追加しません。旧Help実装だけは公開 `/help` への置換済み保管実装として明示しています。

## 📝 コメント

- 全122 TypeScriptファイルにモジュール責務コメントがあります。
- コメントは責務・境界・契約・制約に限定し、単純な分岐・代入・ループ・returnの逐語説明を避けています。
- 重複コメント、120文字超のコメント、汎用的な逐語コメントは今回の監査対象で検出されませんでした。

## 🔗 ドキュメント整合性

公開コマンド統合後も旧Command名を案内していた記述を、現在の `/economy`、`/play`、`/community`、`/event`、`/recruit`、`/moderation`、`/voice` 形式へ更新しました。Node.js要件も22.16以降へ統一しました。

## 🧪 検証状況

相対import先・UTF-8・CRLF混在・ファイル名大小文字衝突・TODO/FIXME・直接console出力（logger実装を除く）を確認しました。

この実行環境では `npm ci` がタイムアウトし、依存関係が完全には展開されていないため、`npm test`、`npm run typecheck`、`npm run verify:commands`、`npm run build` の完走確認はできていません。

## 🧹 最終見直しで修正した点

- 📚 README / 機能計画書 / 移行方針の「48個の入口」という表現を、旧Command実装と公開10入口の区別がつく表現へ修正しました。
- 🗃️ AI Repositoryのコメントを実装内容に合わせ、「役割設定」を削除しました。
- 🏗️ Guild設定の説明を、現状の`guild_settings`保存と将来の`GuildConfig`集約へ分離しました。
- 🎮 数当てゲームがすでに`NumberGameRepository`で永続化されている点を機能計画へ反映しました。
- 🐉 Raidの統合後route表記を`/play raid-status` / `/play raid-attack`へ統一しました。
- ⏰ Temp VCの自動処理は定期JobではなくVoiceState/起動時のListener処理であることが分かるようREADMEを修正しました。
