/** 🔁 旧Command互換層：レイド操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { attackRaid, raidStatus } from "../arcade.service.js";
import { gameColors, gameEmbed, progressBar } from "../fun.view.js";
export const command: BotCommand = {
  category: "fun",
  data: new SlashCommandBuilder().setName("raid").setDescription("サーバー全員でボスを討伐します")
    .addSubcommand((subcommand) => subcommand.setName("status").setDescription("ボスの残りHPを確認します"))
    .addSubcommand((subcommand) => subcommand.setName("attack").setDescription("ボスを攻撃します")),
  async execute(interaction) {
    if (!interaction.guildId) { await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true }); return; }
    if (interaction.options.getSubcommand() === "status") {
      const status = raidStatus(interaction.guildId);
      await interaction.reply({ embeds: [gameEmbed("🐉 今日のボス", `${progressBar(status.hp, status.maxHp)}\n**${status.hp}/${status.maxHp} HP** · 👥 ${status.attackers}人${status.defeated ? "\n🎉 討伐成功" : "\n⚔️ 攻撃：1日1回"}`, gameColors.raid)] });
      return;
    }
    const result = attackRaid(interaction.guildId, interaction.user.id);
    await interaction.reply({ embeds: [gameEmbed(result.status === "already-attacked" ? "🐉 攻撃済み" : result.status === "defeated" ? "🐉 討伐！" : "⚔️ HIT", result.status === "already-attacked" ? `残りHP：${result.hp}` : result.status === "defeated" ? `${result.damage} damage\n+55 まぶP 🎁` : `${result.damage} damage\n残りHP：${result.hp}\n+5 まぶP`, gameColors.raid)] });
  },
};
