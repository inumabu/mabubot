/** 🔁 旧Command互換層：ミステリー操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { answerMystery, getMystery } from "../arcade.service.js";
import { getTokyoDate } from "../../../shared/time/tokyo-date.js";
import { gameColors, gameEmbed } from "../fun.view.js";

export const command: BotCommand = {
  category: "fun",
  data: new SlashCommandBuilder()
    .setName("mystery")
    .setDescription("毎日1問の謎解きに挑戦します")
    .addStringOption((option) => option.setName("answer").setDescription("答え（初回は省略）").setRequired(false).setMaxLength(100)),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const date = getTokyoDate();
    const answer = interaction.options.getString("answer");
    if (!answer) {
      await interaction.reply({ embeds: [gameEmbed(`🧩 今日の謎 · ${date}`, `${getMystery(date).question}\n\n回答：\`/play mystery answer:...\``, gameColors.mystery)], ephemeral: true });
      return;
    }
    const result = answerMystery(interaction.guildId, interaction.user.id, answer, date);
    await interaction.reply({ embeds: [gameEmbed(result.correct
      ? result.reward ? "🎉 正解！" : "🧩 本日のクリア済み"
      : "🧩 もう一度考えてみよう", result.correct
        ? result.reward ? `+${result.reward} まぶP 🎁` : "報酬受取済みです。"
        : "🔁 もう一度どうぞ！", gameColors.mystery)], ephemeral: true });
  },
};
