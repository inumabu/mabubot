/** 🔁 旧Command互換層：まぶP操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { claimDailyPoints, getPoints } from "../economy.facade.js";
import { getTokyoDate } from "../../../shared/time/tokyo-date.js";

export const command: BotCommand = {
  category: "economy",
  data: new SlashCommandBuilder()
    .setName("points")
    .setDescription("まぶP残高を確認・獲得します")
    .addUserOption((option) =>
      option.setName("user").setDescription("残高を確認するメンバー").setRequired(false),
    )
    .addBooleanOption((option) =>
      option.setName("claim").setDescription("今日のデイリーまぶPを受け取る").setRequired(false),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    if (interaction.options.getBoolean("claim")) {
      const claim = claimDailyPoints(interaction.guildId, interaction.user.id, getTokyoDate());
      await interaction.reply({
        content: claim.result === "ok"
          ? `🪙 デイリー報酬 +15 まぶP！現在の残高は ${claim.balance.toLocaleString("ja-JP")} まぶPです。`
          : "✅ 今日のデイリーまぶPは受け取り済みです。",
        ephemeral: true,
      });
      return;
    }
    const user = interaction.options.getUser("user") ?? interaction.user;
    const balance = getPoints(interaction.guildId, user.id);
    await interaction.reply({
      content: `🪙 ${user} の残高：**${balance.toLocaleString("ja-JP")} まぶP**`,
      ephemeral: user.id !== interaction.user.id,
    });
  },
};