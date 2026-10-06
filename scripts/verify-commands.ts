/** 🛠️ 運用スクリプト：公開Commandの定義と登録条件を検証します。 */

import { loadCommands } from "../src/core/client/command-loader.js";
import { logger } from "../src/shared/logger.js";

const commands = await loadCommands();
const serialized = [...commands.values()].map((command) => command.data.toJSON());
const names = serialized.map((command) => command.name);
// 🔒 公開入口は10個に固定し、内部48機能は統合Commandから再利用します。
const expectedNames = ["ai", "community", "economy", "event", "help", "moderation", "play", "profile", "recruit", "voice"];
const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

if (duplicates.length) {
  throw new Error(`❌ Discordコマンド名が重複しています: ${[...new Set(duplicates)].join(", ")}`);
}

if (names.length !== 10 || names.some((name) => !expectedNames.includes(name))) {
  throw new Error(`❌ 公開コマンドは10個に統合されている必要があります: ${names.sort().join(", ")}`);
}

// 🛡️ サブコマンド数の超過はDiscord登録時に失敗するため、CIで先に検出します。
if (serialized.some((command) => (command.options?.length ?? 0) > 25)) {
  throw new Error("❌ 1つのSlash Commandに登録できるサブコマンド数を超えています");
}

if (serialized.some((command) => !command.description?.trim())) {
  throw new Error("❌ すべてのDiscordコマンドには空でないdescriptionが必要です");
}

logger.info("commands", "✅ Discordコマンドの検証が完了しました", {
  count: serialized.length,
  names: names.sort(),
});
