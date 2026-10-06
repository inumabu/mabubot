/** 🔁 旧Command互換層：ワードウルフ操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { getWolfRole, joinWolf, startWolf, voteWolf } from "../arcade.service.js";
import { gameColors, gameEmbed } from "../fun.view.js";
export const command: BotCommand = {
  category: "fun",
  data: new SlashCommandBuilder()
    .setName("wolf")
    .setDescription("ワードウルフのロビーを遊びます")
    .addSubcommand((subcommand) => subcommand.setName("start").setDescription("ゲームを開始します"))
    .addSubcommand((subcommand) => subcommand.setName("join").setDescription("ゲームに参加します"))
    .addSubcommand((subcommand) => subcommand.setName("role").setDescription("自分の役割を確認します"))
    .addSubcommand((subcommand) => subcommand.setName("vote").setDescription("怪しい人に投票します")
      .addUserOption((option) => option.setName("user").setDescription("投票先").setRequired(true))),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "start") {
      startWolf(interaction.guildId, interaction.user.id);
      await interaction.reply({ embeds: [gameEmbed("🐺 ワードウルフ", "参加：`/play wolf-join`\n役割：`/play wolf-role`\n投票：`/play wolf-vote user:...`", gameColors.wolf)] });
      return;
    }
    if (subcommand === "join") {
      const result = joinWolf(interaction.guildId, interaction.user.id);
      await interaction.reply({ embeds: [gameEmbed(result === "joined" ? "🐺 参加完了" : "🐺 ロビー未作成", result === "joined" ? "役割：`/play wolf-role`" : "➡️ 先に `/play wolf-start`", gameColors.wolf)], ephemeral: true });
      return;
    }
    if (subcommand === "role") {
      const role = getWolfRole(interaction.guildId, interaction.user.id);
      await interaction.reply({ embeds: [gameEmbed("🐺 あなたの役割", role === "not-player" ? "🐺 ゲームに参加していません。" : `あなたの役割は **${role === "wolf" ? "ウルフ" : "村人"}** です。`, gameColors.wolf)], ephemeral: true });
      return;
    }
    const target = interaction.options.getUser("user", true);
    const result = voteWolf(interaction.guildId, interaction.user.id, target.id);
    if (result.status === "not-started") await interaction.reply({ content: "🎮 ゲームが開始されていません。", ephemeral: true });
    else if (result.status === "invalid-player") await interaction.reply({ content: "🎯 参加者に対して投票してください。", ephemeral: true });
    else if (result.status === "voted") await interaction.reply({ content: `✅ 投票しました（${result.votes}/${result.total}票）。`, ephemeral: true });
    else await interaction.reply({ embeds: [gameEmbed(`🐺 ${result.won ? "ウルフを見抜きました！" : "ウルフに逃げられました…"}`, `正体は <@${result.wolfId}> でした。`, gameColors.wolf)] });
  },
};
