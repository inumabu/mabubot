/** 🔁 旧Command互換層：Hello操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";

export const command: BotCommand = {
  category: "onboarding",
  data: new SlashCommandBuilder()
    .setName("hello")
    .setDescription("まぶBotから挨拶します"),
  async execute(interaction) {
    await interaction.reply(
      `👋 こんにちは、${interaction.user}さん！まぶ鯖へようこそ。困ったときは /help を確認してください。`,
    );
  },
};