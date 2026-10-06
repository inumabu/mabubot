/** 🔁 旧Command互換層：ダイジェスト操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { getCommunitySnapshot } from "../community.service.js";
import { getTokyoDate } from "../../../shared/time/tokyo-date.js";
import { raidStatus } from "../../fun/arcade.service.js";
import { progressBar } from "../../fun/fun.view.js";

export const command: BotCommand = {
  category: "community",
  data: new SlashCommandBuilder()
    .setName("digest")
    .setDescription("今日のまぶ鯖ダイジェストを表示します"),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const snapshot = getCommunitySnapshot(interaction.guildId);
    const raid = raidStatus(interaction.guildId);
    const embed = new EmbedBuilder()
      .setTitle(`🌙 Mabuserver Daily · ${getTokyoDate()}`)
      .setColor(0x617f77)
      .addFields(
        { name: "🎮 募集", value: `LFG ${snapshot.lfgToday} · VC ${snapshot.vcToday}`, inline: true },
        { name: "🎉 コミュニティ", value: `Event ${snapshot.eventsToday} · Thanks ${snapshot.thanksToday}`, inline: true },
        { name: "💤 今暇", value: `${snapshot.idleCount}人`, inline: true },
        { name: "🐉 レイド", value: `${progressBar(raid.hp, raid.maxHp)}\n${raid.hp}/${raid.maxHp} HP`, inline: false },
      )
      .setFooter({ text: `募集中 ${snapshot.lfgOpen} · 次：${snapshot.nextEvent?.name ?? "なし"}` });
    await interaction.reply({ embeds: [embed] });
  },
};
