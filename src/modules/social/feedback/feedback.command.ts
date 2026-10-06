/** 🔁 旧Command互換層：フィードバック操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { env } from "../../../env.js";
import { submitFeedback } from "./feedback.service.js";

const categoryLabels: Record<string, string> = {
  idea: "💡 要望",
  bug: "🐛 バグ報告",
  improvement: "🛠️ 改善案",
  concern: "🆘 困りごと",
};

export const command: BotCommand = {
  category: "social",
  data: new SlashCommandBuilder()
    .setName("feedback")
    .setDescription("運営へ匿名で要望・相談を送ります")
    .addStringOption((option) =>
      option.setName("category").setDescription("内容の種類").setRequired(true).addChoices(
        { name: "💡 要望", value: "idea" },
        { name: "🐛 バグ報告", value: "bug" },
        { name: "🛠️ 改善案", value: "improvement" },
        { name: "🆘 困りごと", value: "concern" },
      ),
    )
    .addStringOption((option) =>
      option.setName("message").setDescription("運営へのメッセージ").setRequired(true).setMaxLength(1500),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    if (!env.feedbackChannelId) {
      await interaction.reply({ content: "📮 受付先がまだ設定されていません。運営へ直接お知らせください。", ephemeral: true });
      return;
    }
    const category = interaction.options.getString("category", true);
    const message = interaction.options.getString("message", true).trim();
    if (!message) {
      await interaction.reply({ content: "💬 メッセージを入力してください。", ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    const channel = await interaction.client.channels.fetch(env.feedbackChannelId);
    if (!channel?.isTextBased() || !("send" in channel)) {
      await interaction.editReply("📮 受付チャンネルを利用できません。運営へ連絡してください。");
      return;
    }
    const embed = new EmbedBuilder()
      .setTitle(`📮 匿名Feedback · ${categoryLabels[category] ?? category}`)
      .setDescription(message)
      .setColor(0x6c8fb2)
      .setTimestamp();
    await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
    submitFeedback(interaction.guildId, category, message);
    await interaction.editReply("✅ 匿名で運営へ送信しました。");
  },
};