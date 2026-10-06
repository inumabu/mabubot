/** 🔁 旧Command互換層：Thanks操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { sendThanks } from "./thanks.service.js";

export const command: BotCommand = {
  category: "social",
  data: new SlashCommandBuilder()
    .setName("thanks")
    .setDescription("メンバーへ感謝を送ります")
    .addUserOption((option) =>
      option.setName("user").setDescription("感謝を伝える相手").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("message").setDescription("ひとこと").setRequired(false).setMaxLength(200),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const recipient = interaction.options.getUser("user", true);
    if (recipient.bot || recipient.id === interaction.user.id) {
      await interaction.reply({ content: "⚠️ 自分自身やBotには送れません。", ephemeral: true });
      return;
    }
    const message = interaction.options.getString("message")?.trim();
    sendThanks(interaction.guildId, interaction.user.id, recipient.id, message || undefined);
    await interaction.reply({
      content: `🙏 ${recipient} さんに感謝を送りました ✨${message ? `\n「${message}」` : ""}`,
      allowedMentions: { users: [recipient.id] },
    });
  },
};