/** 🔁 旧Command互換層：ミッション操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { claimMissionReward } from "../economy.facade.js";
import { getTokyoDate } from "../../../shared/time/tokyo-date.js";

const missions = [
  "まだ話したことのない人と話す",
  "誰かの募集に参加する",
  "今日の雑談のお題に答える",
  "メンバーに感謝を伝える",
  "みんなで遊ぶゲームを提案する",
];

export const command: BotCommand = {
  category: "economy",
  data: new SlashCommandBuilder()
    .setName("mission")
    .setDescription("今日のデイリーミッションを確認・達成します")
    .addBooleanOption((option) =>
      option.setName("claim").setDescription("ミッション達成を報告して報酬を受け取る").setRequired(false),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const date = getTokyoDate();
    if (interaction.options.getBoolean("claim")) {
      const result = claimMissionReward(interaction.guildId, interaction.user.id, date);
      await interaction.reply({
        content: result.result === "ok"
          ? `🎯 ミッション達成！ +50 まぶP（残高 ${result.balance.toLocaleString("ja-JP")}）`
          : "✅ 今日のミッション報酬は受け取り済みです。",
        ephemeral: true,
      });
      return;
    }
    const day = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
    const mission = missions[((day % missions.length) + missions.length) % missions.length];
    await interaction.reply({
      embeds: [{
        title: "🎯 今日のミッション",
        description: `> ${mission}\n\n✅ 達成したら /economy mission claim:true を実行してください。`,
        color: 0x698c6b,
        footer: { text: "🎁 報酬: 50 まぶP（1日1回）" },
      }],
      ephemeral: true,
    });
  },
};