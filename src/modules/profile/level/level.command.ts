/** 🔁 旧Command互換層：レベル操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { getProfile } from "../profile.service.js";

export const command: BotCommand = {
  category: "profile",
  data: new SlashCommandBuilder()
    .setName("level")
    .setDescription("まぶ度とXPを確認します")
    .addUserOption((option) =>
      option.setName("user").setDescription("確認するメンバー").setRequired(false),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const user = interaction.options.getUser("user") ?? interaction.user;
    const profile = getProfile(interaction.guildId, user.id);
    await interaction.reply({
      content: `🌙 ${user} の **Mabu Level ${profile.level}**\n🔥 XP：${profile.currentLevelXp} / ${profile.nextLevelXp}（累計 ${profile.totalXp}）`,
      ephemeral: true,
    });
  },
};