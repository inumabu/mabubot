/** 🔁 旧Command互換層：一時VC操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { createTempVoiceChannel } from "./tempvc.service.js";

export const command: BotCommand = {
  category: "voice",
  data: new SlashCommandBuilder()
    .setName("tempvc")
    .setDescription("一時的なボイスチャンネルを作成します")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("自分用の一時VCを作成します")
        .addStringOption((option) => option.setName("name").setDescription("チャンネル名").setRequired(false).setMaxLength(90))
        .addIntegerOption((option) => option.setName("limit").setDescription("参加上限（0は無制限）").setRequired(false).setMinValue(0).setMaxValue(99)),
    ),
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
      const channel = await createTempVoiceChannel({
        guild: interaction.guild,
        ownerId: interaction.user.id,
        ownerName: interaction.user.username,
        name: interaction.options.getString("name") ?? undefined,
        limit: interaction.options.getInteger("limit") ?? undefined,
      });
      await interaction.editReply({ content: `🔊 一時VCを作成しました：${channel}` });
    } catch (error) {
      const message = error instanceof Error && error.message === "OWNER_NOT_IN_VOICE"
        ? "🔊 先にボイスチャンネルへ参加してから実行してください。"
        : error instanceof Error && error.message === "MISSING_MANAGE_CHANNELS"
          ? "🛡️ Botにチャンネル管理権限がありません。"
          : "❌ 一時VCを作成できませんでした。Botの権限と設定を確認してください。";
      await interaction.editReply({ content: message });
    }
  },
};