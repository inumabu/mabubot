/** 🔁 旧Command互換層：ステータス操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { getCommunitySnapshot } from "../community.service.js";

export const command: BotCommand = {
  category: "community",
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("まぶ鯖の現在状況を表示します"),
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const guild = interaction.guild;
    const snapshot = getCommunitySnapshot(guild.id);
    const online = guild.presences.cache.filter((presence) => presence.status !== "offline").size;
    const voice = guild.voiceStates.cache.size;
    const embed = new EmbedBuilder()
      .setTitle(`🌙 ${guild.name} の現在状況`)
      .setColor(0x5c8f87)
      .addFields(
        { name: "👥 Online", value: `${online}`, inline: true },
        { name: "🔊 In VC", value: `${voice}`, inline: true },
        { name: "🎮 LFG", value: `${snapshot.lfgOpen}`, inline: true },
        { name: "💤 Idle", value: `${snapshot.idleCount}`, inline: true },
        { name: "🎉 Next Event", value: snapshot.nextEvent?.name ?? "予定なし", inline: true },
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};