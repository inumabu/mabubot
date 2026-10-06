/** 🔁 旧Command互換層：設定操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { CommunityToolsRepository } from "../../community/tools.repository.js";
const repository = new CommunityToolsRepository();
const welcomeKeys = ["welcome.title", "welcome.message", "welcome.tutorial"] as const;
export const command: BotCommand = {
  category: "moderation",
  data: new SlashCommandBuilder().setName("config").setDescription("Botのサーバー設定を管理します").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName("set").setDescription("設定を保存").addStringOption((o) => o.setName("key").setDescription("設定名").setRequired(true)).addStringOption((o) => o.setName("value").setDescription("値").setRequired(true).setMaxLength(1000)))
    .addSubcommand((s) => s.setName("show").setDescription("設定を表示"))
    .addSubcommand((s) => s.setName("welcome").setDescription("Welcome文面を設定").addStringOption((o) => o.setName("title").setDescription("歓迎タイトル").setMaxLength(100)).addStringOption((o) => o.setName("message").setDescription("歓迎本文").setMaxLength(500)).addStringOption((o) => o.setName("tutorial").setDescription("DMチュートリアル").setMaxLength(1000)))
    .addSubcommand((s) => s.setName("welcome-reset").setDescription("Welcome文面を初期化")),
  async execute(interaction) {
    if (!interaction.guildId || !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) { await interaction.reply({ content: "🛡️ Manage Server権限が必要です。", ephemeral: true }); return; }
    const sub = interaction.options.getSubcommand();
    if (sub === "welcome") {
      const values: [string, string | null][] = [["welcome.title", interaction.options.getString("title")], ["welcome.message", interaction.options.getString("message")], ["welcome.tutorial", interaction.options.getString("tutorial")]];
      for (const [key, value] of values) if (value?.trim()) repository.set(interaction.guildId, key, value.trim());
      await interaction.reply({ content: "🌱 Welcome設定を更新しました。", ephemeral: true }); return;
    }
    if (sub === "welcome-reset") { for (const key of welcomeKeys) repository.delete(interaction.guildId, key); await interaction.reply({ content: "🌱 Welcome設定を初期化しました。", ephemeral: true }); return; }
    if (sub === "set") { repository.set(interaction.guildId, interaction.options.getString("key", true), interaction.options.getString("value", true)); await interaction.reply({ content: "⚙️ 設定を保存しました。", ephemeral: true }); return; }
    const settings = repository.settings(interaction.guildId);
    await interaction.reply({ content: settings.length ? settings.map((s) => `⚙️ **${s.key}**：${s.value}`).join("\n") : "⚙️ 設定はありません。", ephemeral: true });
  },
};
