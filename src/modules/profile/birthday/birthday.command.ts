/** 🔁 旧Command互換層：誕生日操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { getProfile, setBirthday } from "../profile.service.js";

function isValidMonthDay(value: string): boolean {
  if (!/^\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`2000-${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(5, 10) === value;
}

export const command: BotCommand = {
  category: "profile",
  data: new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("誕生日を登録・確認します")
    .addStringOption((option) =>
      option
        .setName("date")
        .setDescription("誕生日（MM-DD形式、例: 04-18）")
        .setRequired(false)
        .setMaxLength(5),
    )
    .addBooleanOption((option) =>
      option.setName("clear").setDescription("登録した誕生日を削除する").setRequired(false),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    if (interaction.options.getBoolean("clear")) {
      setBirthday(interaction.guildId, interaction.user.id, null);
      await interaction.reply({ content: "🎂 誕生日を削除しました。", ephemeral: true });
      return;
    }
    const date = interaction.options.getString("date");
    if (!date) {
      const profile = getProfile(interaction.guildId, interaction.user.id);
      await interaction.reply({
        content: profile.birthday ? `🎂 登録済みの誕生日：${profile.birthday}` : "🎂 誕生日はまだ登録されていません。",
        ephemeral: true,
      });
      return;
    }
    if (!isValidMonthDay(date)) {
      await interaction.reply({ content: "🎂 誕生日はMM-DD形式で入力してください。", ephemeral: true });
      return;
    }
    setBirthday(interaction.guildId, interaction.user.id, date);
    await interaction.reply({ content: `🎂 誕生日を ${date} に登録しました。`, ephemeral: true });
  },
};