# 🎮 追加ゲーム

まぶBotのゲーム機能は、短時間で遊べるミニゲームと、収集・協力要素を組み合わせたモジュールです。

---

## 🕹️ ゲーム一覧（公開入口：/play）

| コマンド | 内容 | 状態 |
| --- | --- | --- |
| `/play mystery` | 日替わり謎解き | ✅ 実装済み |
| `/play quiz-start` / `/play quiz-answer` | サーバー内クイズ | ✅ 実装済み |
| `/play wolf-*` | Word Wolfのロビーと投票 | ✅ 実装済み |
| `/play reaction` | 絵文字リアクション早押し | ✅ 実装済み |
| `/play race-start` / `/play race-pick` | 走者予想レース | ✅ 実装済み |
| `/play fishing-cast` / `/play fishing-book` | 釣りと魚コレクション | ✅ 実装済み |
| `/play raid-status` / `/play raid-attack` | 日替わり協力ボス討伐 | ✅ 実装済み |

---

## 🔄 データの扱い

```text
Command
  ↓
Game Service
  ├── 🎲 短時間ゲーム状態（Service層）
  └── 💰 報酬・Inventory・実績（Economy / GameStats Repository）
```

- ⚡ 短時間で完結するセッションはService層で管理
- 💰 ポイントやアイテム報酬は既存のEconomy Repositoryを経由
- 🏆 勝利数・参加数などの実績はGameStatsへ保存
- 🐟 魚コレクションはInventoryと魚図鑑へ統合

> ⚠️ 現在、短時間ゲームの一部状態はプロセス内メモリで管理しています。Bot再起動後も継続したいゲームは、将来的にSQLite Repositoryへ移行します。

---

## 🧪 実装時のチェックポイント

新しいゲームを追加するときは、次を確認します。

- [ ] 🧩 CommandとServiceの責務を分ける
- [ ] 🎯 勝敗判定を決定論的にテストできるようにする
- [ ] 💰 報酬の一回性・上限・Cooldownを確認する
- [ ] 🏠 Guild/User単位のデータ境界を守る
- [ ] 🎨 EmbedとButtonの表示上限を確認する
- [ ] 🧪 `npm run typecheck` と `npm test` を実行する
- [ ] 📚 機能計画書と追加実装候補を更新する

---

## 🔗 関連ドキュメント

- 📋 [機能計画書](../../../docs/feature-plan.md)
- 💡 [追加実装候補](../../../docs/feature-ideas.md)
- 🏗️ [アーキテクチャ設計書](../../../docs/architecture.md)
