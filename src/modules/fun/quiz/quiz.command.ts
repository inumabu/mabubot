/** 🔁 旧Command互換層：クイズ操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { answerArcadeQuiz, startArcadeQuiz } from "../arcade.service.js";
import { gameColors, gameEmbed } from "../fun.view.js";
export const command: BotCommand = {
  category: "fun",
  data: new SlashCommandBuilder()
    .setName("quiz")
    .setDescription("サーバー内クイズに挑戦します")
    .addSubcommand((subcommand) => subcommand.setName("start").setDescription("問題を出題します"))
    .addSubcommand((subcommand) => subcommand.setName("answer").setDescription("クイズに回答します")
      .addStringOption((option) => option.setName("text").setDescription("回答").setRequired(true).setMaxLength(100))),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    if (interaction.options.getSubcommand() === "start") {
      await interaction.reply({ embeds: [gameEmbed("🧠 クイズ", `**${startArcadeQuiz(interaction.guildId)}**\n\n回答：\`/play quiz-answer text:...\``, gameColors.quiz)] });
      return;
    }
    const result = answerArcadeQuiz(interaction.guildId, interaction.options.getString("text", true), Date.now(), interaction.user.id);
    if (result.status === "not-started") {
      await interaction.reply({ content: "🧠 先に /play quiz-start で問題を出してください。", ephemeral: true });
      return;
    }
    await interaction.reply({ embeds: [gameEmbed(result.correct ? "✅ 正解！" : "❌ 不正解", result.correct ? "次の問題：\`/play quiz-start\`" : `答え：${result.answer}`, gameColors.quiz)] });
  },
};
