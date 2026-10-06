/** 🔁 旧Command互換層：Streak操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { getTokyoDate } from "../../../shared/time/tokyo-date.js";
import { getProfile } from "../profile.service.js";
import { recordStreakCheckin } from "./streak.service.js";

export const command: BotCommand = {
  category: "profile",
  data: new SlashCommandBuilder()
    .setName("streak")
    .setDescription("連続活動日数を確認・記録します")
    .addBooleanOption((option) =>
      option.setName("checkin").setDescription("今日の活動を記録して報酬を受け取る").setRequired(false),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const date = getTokyoDate();
    if (interaction.options.getBoolean("checkin")) {
      const result = recordStreakCheckin(interaction.guildId, interaction.user.id, date);
      await interaction.reply({
        content: result.changed
          ? `🔥 ${result.streakCount}日連続！チェックイン報酬 +5 まぶP、+25 XP。`
          : `✅ 今日の記録は完了しています。現在 **${result.streakCount}日連続** です。`,
        ephemeral: true,
      });
      return;
    }
    const profile = getProfile(interaction.guildId, interaction.user.id);
    await interaction.reply({
      content: `🔥 現在の連続活動日数：**${profile.streakCount}日**\n記録するには \`/profile streak checkin:true\` を実行してください。`,
      ephemeral: true,
    });
  },
};