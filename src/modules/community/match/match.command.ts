/** 🔁 旧Command互換層：マッチング操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { getMatchResults, type MatchType } from "../community.service.js";

const labels: Record<MatchType, string> = { gaming: "ゲーム", chat: "雑談", vc: "VC" };

export const command: BotCommand = {
  category: "community",
  data: new SlashCommandBuilder()
    .setName("match")
    .setDescription("希望が近いメンバーや募集を探します")
    .addStringOption((option) =>
      option.setName("type").setDescription("探したい活動").setRequired(true).addChoices(
        { name: "ゲーム", value: "gaming" },
        { name: "雑談", value: "chat" },
        { name: "VC", value: "vc" },
      ),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const type = interaction.options.getString("type", true) as MatchType;
    const results = getMatchResults(interaction.guildId, type);
    const visibleMembers = results.members.slice(0, 20);
    const visibleRecruitments = results.recruitments.slice(0, 10);
    const lines = [
      ...visibleMembers.map((member) => `💤 <@${member.userId}>`),
      ...(results.members.length > visibleMembers.length ? [`👥 ほか${results.members.length - visibleMembers.length}人`] : []),
      ...visibleRecruitments.map((post) => `🎮 **${post.activity}** · ${post.memberIds.length}/${post.capacity}人 · <#${post.voiceChannelId ?? post.channelId}>`),
      ...(results.recruitments.length > visibleRecruitments.length ? [`📣 ほか${results.recruitments.length - visibleRecruitments.length}件の募集`] : []),
    ];
    const embed = new EmbedBuilder()
      .setTitle(`🤝 ${labels[type]}のマッチング`)
      .setColor(0x668f88)
      .setDescription(lines.length ? lines.join("\n") : "🔎 今参加できるメンバーや募集はありません。");
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};