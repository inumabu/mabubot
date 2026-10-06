/** 🔁 旧Command互換層：投票操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";

export const command: BotCommand = {
  category: "events",
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("投票を作成します")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("投票の質問")
        .setRequired(true)
        .setMaxLength(300),
    )
    .addStringOption((option) =>
      option
        .setName("choices")
        .setDescription("選択肢を | で区切って入力（2〜10個）")
        .setRequired(true)
        .setMaxLength(500),
    ),
  async execute(interaction) {
    const question = interaction.options.getString("question", true).trim();
    const choices = interaction.options
      .getString("choices", true)
      .split("|")
      .map((choice) => choice.trim())
      .filter(Boolean);

    if (!question) {
      await interaction.reply({ content: "📊 投票の質問を入力してください。", ephemeral: true });
      return;
    }
    if (choices.length < 2 || choices.length > 10) {
      await interaction.reply({
        content: "📊 選択肢は2個以上10個以下で入力してください。",
        ephemeral: true,
      });
      return;
    }
    if (choices.some((choice) => choice.length > 55)) {
      await interaction.reply({ content: "✏️ 選択肢はそれぞれ55文字以内で入力してください。", ephemeral: true });
      return;
    }
    if (new Set(choices).size !== choices.length) {
      await interaction.reply({
        content: "⚠️ 選択肢が重複しています。別々の内容を入力してください。",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `📊 ${question}`,
      poll: {
        question: { text: question },
        answers: choices.map((text) => ({ text })),
        duration: 24,
        allowMultiselect: false,
      },
    });
  },
};