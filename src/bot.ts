/** 🤖 Bot起動：Discord Clientを初期化し、Command・Interaction・定期処理を登録します。 */

import { Client, GatewayIntentBits } from "discord.js";
import { env } from "./env.js";
import { loadCommands } from "./core/client/command-loader.js";
import { registerInteractionCreate } from "./core/events/interaction-create.js";
import { registerTempVoiceListener } from "./modules/voice/tempvc/tempvc.listener.js";
import { registerScheduledJobs } from "./jobs/scheduled-jobs.js";
import { registerAutoModListener } from "./modules/moderation/automod/automod.listener.js";
import { registerWelcomeListener } from "./modules/onboarding/welcome/welcome.listener.js";
import { logger } from "./shared/logger.js";

export async function startBot(): Promise<void> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent,
    ],
  });
  const commands = await loadCommands();
  logger.info("bot", "📋 コマンドを読み込みました", { count: commands.size });

  registerInteractionCreate(client, commands);
  registerTempVoiceListener(client);
  registerScheduledJobs(client);
  registerAutoModListener(client);
  registerWelcomeListener(client);
  client.once("ready", (readyClient) => {
    logger.info("bot", "✅ Discord へログインしました", {
      user: readyClient.user.tag,
      guilds: readyClient.guilds.cache.size,
      commands: commands.size,
    });
  });

  logger.info("bot", "🔌 Discord へ接続しています");
  await client.login(env.discordToken);
}
