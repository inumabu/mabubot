/** 🔁 旧Command互換層：記念日操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { createCelebration, listCelebrations } from "./celebrate.service.js";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(date));
}

export const command: BotCommand = {
  category: "events",
  data: new SlashCommandBuilder()
    .setName("celebrate")
    .setDescription("記念イベントを作成・確認します")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("記念イベントを作成します")
        .addStringOption((option) => option.setName("title").setDescription("記念イベント名").setRequired(true).setMaxLength(100))
        .addStringOption((option) => option.setName("starts_at").setDescription("開始日時（ISO 8601、+09:00を指定）").setRequired(true).setMaxLength(40))
        .addStringOption((option) => option.setName("description").setDescription("説明").setRequired(false).setMaxLength(500)),
    )
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("記念イベント一覧を表示します")),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    if (interaction.options.getSubcommand() === "list") {
      const celebrations = listCelebrations(interaction.guildId);
      await interaction.reply({
        embeds: [{
          title: "🎉 記念イベント",
          description: celebrations.length
            ? celebrations.map((item) => `**${item.title}** · ${formatDate(item.startsAt)}${item.description ? `\n${item.description.slice(0, 100)}` : ""}`).join("\n\n")
            : "📅 予定されている記念イベントはありません。",
          color: 0xd28a50,
        }],
        ephemeral: true,
      });
      return;
    }
    const startsAtValue = interaction.options.getString("starts_at", true);
    const startsAt = new Date(startsAtValue);
    const title = interaction.options.getString("title", true).trim();
    if (!title || !/[zZ]|[+-]\d{2}:\d{2}$/.test(startsAtValue) || !Number.isFinite(startsAt.getTime()) || startsAt <= new Date()) {
      await interaction.reply({ content: "⏰ タイトルと、未来のISO 8601日時（例: 2026-12-24T22:00+09:00）を入力してください。", ephemeral: true });
      return;
    }
    const celebration = createCelebration({
      guildId: interaction.guildId,
      ownerId: interaction.user.id,
      title,
      startsAt: startsAt.toISOString(),
      description: interaction.options.getString("description")?.trim() || undefined,
    });
    await interaction.reply({
      embeds: [{
        title: `🎉 ${celebration.title}`,
        description: `${celebration.description ? `${celebration.description}\n\n` : ""}📅 ${formatDate(celebration.startsAt)}開催`,
        color: 0xd28a50,
      }],
    });
  },
};