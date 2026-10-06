/** 🔁 旧Command互換層：AI操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { env } from "../../../env.js";
import { formatError, logger } from "../../../shared/logger.js";
import { askMabuAi } from "./ai.service.js";

export const command: BotCommand = {
  category: "ai",
  data: new SlashCommandBuilder()
    .setName("ai")
    .setDescription("まぶ鯖専属AIに質問します")
    .addStringOption((option) =>
      option.setName("prompt").setDescription("質問").setRequired(true).setMaxLength(1500),
    ),
  async execute(interaction) {
    if (!env.aiApiKey) {
      await interaction.reply({ content: "🤖 AI機能は現在設定されていません。", ephemeral: true });
      return;
    }
    const prompt = interaction.options.getString("prompt", true).trim();
    if (!prompt) {
      await interaction.reply({ content: "💬 質問を入力してください。", ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
      const response = await askMabuAi(
        interaction.guildId ?? "direct-message",
        interaction.user.id,
        prompt,
        interaction.guild?.name ?? "まぶ鯖",
      );
      await interaction.editReply(response.slice(0, 1900));
    } catch (error) {
      logger.error("ai", "❌ リクエストに失敗しました", { error: formatError(error) });
      await interaction.editReply("❌ AIへの接続に失敗しました。少し時間をおいて再度お試しください。");
    }
  },
};
