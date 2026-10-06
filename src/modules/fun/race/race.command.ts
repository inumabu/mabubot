/** 🔁 旧Command互換層：レース操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { pickRace, startRace } from "../arcade.service.js";
import { gameColors, gameEmbed } from "../fun.view.js";
export const command: BotCommand = {
  category: "fun",
  data: new SlashCommandBuilder().setName("race").setDescription("まぶレースの勝者を予想します")
    .addSubcommand((subcommand) => subcommand.setName("start").setDescription("レースを開始します"))
    .addSubcommand((subcommand) => subcommand.setName("pick").setDescription("勝者を予想します")
      .addStringOption((option) => option.setName("racer").setDescription("予想する走者").setRequired(true)
        .addChoices(...["月うさぎ", "星ねこ", "夜ふくろう", "流れ星"].map((name) => ({ name, value: name }))))),
  async execute(interaction) {
    if (!interaction.guildId) { await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true }); return; }
    if (interaction.options.getSubcommand() === "start") {
      const race = startRace(interaction.guildId);
      await interaction.reply({ embeds: [gameEmbed("🏁 まぶレース", `${race.racers.map((racer, index) => `${index + 1}️⃣ ${racer}`).join("\n")}\n\n予想：\`/play race-pick racer:...\``, gameColors.race)] });
      return;
    }
    const result = pickRace(interaction.guildId, interaction.user.id, interaction.options.getString("racer", true));
    const message = result.status === "not-started" ? "先に `/play race-start` を実行してください。" : result.status === "already-picked" ? "✅ このレースにはすでに予想済みです。" : result.status === "invalid-racer" ? "⚠️ その走者は選べません。" : result.winner ? `${result.status === "won" ? "🎉 的中！" : "💨 はずれ…"}\n1位は **${result.winner}** でした。${result.points ? `\n+${result.points} まぶP` : ""}` : "❌ 処理できませんでした。";
    await interaction.reply({ embeds: [gameEmbed("🏁 予想結果", message, gameColors.race)], ephemeral: true });
  },
};
