# 💡 追加実装候補・統合案

既存機能をさらに育てるための候補を、**実装済み・次にやること・運用上の注意**に分けて整理しています。

> 🧭 **優先順位の見方**
>
> 🔴 高：運用・安全性・既存機能への影響が大きい
>
> 🟡 中：体験向上や継続利用に効果がある
>
> 🟢 低：余裕があるときの改善候補

---

## ✅ 実装状況

| 候補 | 統合先 | 効果 | 状態 |
| --- | --- | --- | --- |
| 🎮 ゲーム実績・ゲームランキング | `/community leaderboard`、Profile、称号 | 各ゲームの勝利数・釣果・レイド貢献を可視化 | ✅ 実装済み |
| 🐟 魚図鑑 | `/profile card`、Inventory、Shop | `/play fishing-cast`の継続プレイと収集要素を強化 | ✅ 実装済み |
| 📢 レイド告知・終了通知 | Scheduled Jobs、`/community digest` | 協力イベントを認知しやすくする | 🔴 高 |
| 💾 ゲーム結果の永続化 | SQLite Repository | 再起動後もゲームを継続可能にする | 🔴 高 |
| 🏆 週間ゲーム大会 | Event、Leaderboard、まぶP | 毎週の参加動機を作る | 🟡 中 |
| 🛡️ 不正対策・報酬上限 | Economy Repository | 連打・多重報酬による経済インフレを防ぐ | 🔴 高 |
| 🏷️ 実績による称号解放 | Profile、Title | 継続プレイに長期目標を追加する | 🟡 中 |

---

## 🪜 推奨する次の実装順

### 1️⃣ ゲーム実績から称号を解放

`game_stats`に記録される勝利数・参加数・スコアを使い、称号の解放条件を追加します。

```text
GameStats
   ↓
Achievement condition
   ↓
Title unlock
   ↓
Profile / Card / Leaderboard
```

**メリット**：既存のGameStats、Profile、Titleの境界を活用でき、追加コストが比較的低いです。

### 2️⃣ レイドの定期告知・終了通知

Scheduled Jobsと`/community digest`を接続し、レイドの開始・残りHP・討伐結果を通知します。

- 📣 開始告知
- ❤️ 残りHPの定期通知
- 🎉 討伐成功通知
- 🧾 参加者・貢献度のサマリー

### 3️⃣ 短時間ゲーム状態の永続化

現在プロセス内メモリで管理している次の状態をSQLiteへ移行します（数当てはすでに`NumberGameRepository`で永続化済みです）。

- 🧩 Quiz
- 🏁 Race
- 🐺 Word Wolf
- ⚡ Reaction
- 🐉 Raid

Bot再起動後や複数プロセス運用にも耐えられるようになります。

### 4️⃣ 報酬の不正対策

Economy Repositoryの一回性・上限チェックを強化します。

- ⏱️ Cooldown
- 🔢 1日あたりの上限
- 🔐 冪等キー
- 🧾 報酬理由の監査ログ
- 🚨 異常な連続実行の検知

---

## 🧩 実装時の設計ルール

- 🗄️ 報酬処理は必ずEconomy Repository / Facadeを通す
- 🔒 Guild単位・User単位の境界を崩さない
- 🔁 再実行しても二重報酬にならないようにする
- 🧪 正常系だけでなく、期限切れ・権限不足・重複実行をテストする
- 💾 永続化する場合はMigrationとBackup手順を同時に更新する
- 📚 README、運用ガイド、機能計画書を同じ変更で更新する

---

## ⚠️ 運用上の注意

現在の短時間ゲーム状態はプロセス内メモリで管理しています。

> 🚧 **制約**
>
> Botを複数プロセスで運用する前、または再起動後もイベントを継続したい場合は、Quiz・Race・Word Wolf・Reaction・Raidの状態をSQLite Repositoryへ移行してください。

また、SQLiteを複数Botプロセスで共有せず、報酬処理は既存のトランザクション境界を維持してください。

---

## 📌 関連ドキュメント

- 🏗️ [アーキテクチャ設計書](architecture.md)
- 📋 [機能計画書](feature-plan.md)
- 🛠️ [導入・運用ガイド](operations.md)
- 📖 [README](../README.md)
