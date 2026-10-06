/** 🔁 旧Command互換層：監査ログ操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { AuditLogEvent, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";

export const command: BotCommand = {
  category: "moderation",
  data: new SlashCommandBuilder()
    .setName("modlog")
    .setDescription("サーバーの処分・監査ログを確認します")
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog)
    .addUserOption((option) =>
      option.setName("user").setDescription("対象メンバーで絞り込む").setRequired(false),
    )
    .addIntegerOption((option) =>
      option.setName("limit").setDescription("表示件数（1〜10）").setRequired(false).setMinValue(1).setMaxValue(10),
    ),
  async execute(interaction) {
    if (!interaction.guild || !interaction.memberPermissions?.has(PermissionFlagsBits.ViewAuditLog)) {
      await interaction.reply({ content: "🛡️ 監査ログを確認する権限がありません。", ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser("user");
    const limit = interaction.options.getInteger("limit") ?? 5;
    const logs = await interaction.guild.fetchAuditLogs({ limit: Math.min(100, limit * 5) });
    const entries = [...logs.entries.values()]
      .filter((entry) => !target || entry.targetId === target.id)
      .slice(0, limit);
    if (!entries.length) {
      await interaction.editReply("🔎 該当する監査ログはありません。");
      return;
    }
    const lines = entries.map((entry) => {
      const action = AuditLogEvent[entry.action] ?? `Action ${entry.action}`;
      const targetName = entry.target && "username" in entry.target ? entry.target.username : entry.targetId ?? "不明";
      const date = new Intl.DateTimeFormat("ja-JP", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Tokyo",
      }).format(entry.createdAt);
      return `**${action}** · ${targetName}\n実行者: ${entry.executor?.tag ?? "不明"} · ${date}${entry.reason ? `\n理由: ${entry.reason}` : ""}`;
    });
    await interaction.editReply({
      embeds: [{ title: "🛡️ Moderation Log", description: lines.join("\n\n").slice(0, 4000), color: 0x9a665d }],
    });
  },
};