/** 🔁 旧Command互換層：ランキング操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { EconomyRepository } from "../../economy/economy.repository.js";
import { ProfileRepository, type ProfileLeaderboardMetric } from "../../profile/profile.repository.js";
import { GameStatsRepository } from "../../fun/game/game-stats.repository.js";

const economy = new EconomyRepository();
const profiles = new ProfileRepository();
const gameStats = new GameStatsRepository();

export const command: BotCommand = {
  category: "community",
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("サーバー内のランキングを表示します")
    .addStringOption((option) =>
      option
        .setName("metric")
        .setDescription("ランキングの種類")
        .setRequired(true)
        .addChoices(
          { name: "まぶP", value: "points" },
          { name: "レベル（XP）", value: "xp" },
          { name: "連続ログイン", value: "streak" },
          { name: "ゲーム勝利数", value: "game_wins" },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("limit")
        .setDescription("表示人数（3〜10）")
        .setRequired(false)
        .setMinValue(3)
        .setMaxValue(10),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const metric = interaction.options.getString("metric", true);
    const limit = interaction.options.getInteger("limit") ?? 10;
    const rankIcon = (index: number) => ["🥇", "🥈", "🥉"][index] ?? `▫️${index + 1}`;
    const lines = metric === "points"
      ? economy.getPointsLeaderboard(interaction.guildId, limit).map((entry, index) =>
          `${rankIcon(index)} <@${entry.userId}>  **${entry.balance.toLocaleString("ja-JP")} P**`)
      : metric === "game_wins"
        ? gameStats.getWinsLeaderboard(interaction.guildId, "all", limit).map((entry, index) =>
            `${rankIcon(index)} <@${entry.userId}>  **${entry.wins}勝** · ${entry.score}pt`)
        : profiles.getLeaderboard(interaction.guildId, metric as ProfileLeaderboardMetric, limit).map((entry, index) =>
          `${rankIcon(index)} <@${entry.userId}>  **${entry.value.toLocaleString("ja-JP")}${metric === "xp" ? " XP" : "日"}**`);
    const title = metric === "points" ? "🪙 まぶPランキング" : metric === "xp" ? "⭐ レベルランキング" : metric === "streak" ? "🔥 連続ログインランキング" : "🎮 ゲーム勝利数ランキング";
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle(`🏆 ${title}`)
        .setDescription(lines.length ? lines.join("\n") : "📊 まだランキングに参加しているメンバーはいません。")
        .setColor(0xf2b84b)
        .setFooter({ text: "🏆 まぶBot ランキング" })],
    });
  },
};
