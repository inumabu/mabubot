/** 🔁 旧Command互換層：ガチャ操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { gachaCost, performGacha } from "./gacha.service.js";

export const command: BotCommand = {
  category: "economy",
  data: new SlashCommandBuilder()
    .setName("gacha")
    .setDescription(`まぶ鯖ガチャを引きます（${gachaCost}まぶP）`),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const { result, drop } = performGacha(interaction.guildId, interaction.user.id);
    if (result !== "ok") {
      await interaction.reply({ content: `🪙 ガチャには ${gachaCost} まぶP必要です。`, ephemeral: true });
      return;
    }
    const color = drop.rarity === "SSR" ? 0xe0b448 : drop.rarity === "R" ? 0x65a3ba : 0x75817a;
    await interaction.reply({
      embeds: [{
        title: `✨ ${drop.rarity}！`,
        description: `🎁 「${drop.name}」を獲得しました。`,
        color,
        footer: { text: `🪙 -${gachaCost} まぶP` },
      }],
    });
  },
};