/** 🛠️ 運用スクリプト：DiscordへのCommand登録を実行します。 */

import { REST, Routes } from "discord.js";
import { env } from "../src/env.js";
import { loadCommands } from "../src/core/client/command-loader.js";
import { logger } from "../src/shared/logger.js";

const commands = await loadCommands();
const rest = new REST({ version: "10" }).setToken(env.discordToken);
const commandData = [...commands.values()].map((command) => command.data.toJSON());
const route = env.discordGuildId
  ? Routes.applicationGuildCommands(env.discordClientId, env.discordGuildId)
  : Routes.applicationCommands(env.discordClientId);

await rest.put(route, { body: commandData });
logger.info("commands", "🚀 コマンド登録が完了しました", {
  count: commandData.length,
  scope: env.discordGuildId ? "guild" : "global",
  guildId: env.discordGuildId,
});
