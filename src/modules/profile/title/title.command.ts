/** 🔁 旧Command互換層：称号操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { equipTitle, getOwnedTitles } from "../profile.service.js";
import { getTitleName, titles } from "./title.catalog.js";

export const command: BotCommand = {
  category: "profile",
  data: new SlashCommandBuilder()
    .setName("title")
    .setDescription("称号を確認・装備します")
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("所持称号を表示します"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("equip")
        .setDescription("所持称号を装備します")
        .addStringOption((option) =>
          option
            .setName("title")
            .setDescription("装備する称号")
            .setRequired(true)
            .addChoices(...titles.map(({ id, name }) => ({ name, value: id }))),
        ),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    if (interaction.options.getSubcommand() === "equip") {
      const titleId = interaction.options.getString("title", true);
      const equipped = equipTitle(interaction.guildId, interaction.user.id, titleId);
      await interaction.reply({
        content: equipped
          ? `🌙 「${getTitleName(titleId)}」を装備しました。`
          : "🏷️ その称号はまだ所持していません。レベルを上げて獲得しましょう。",
        ephemeral: true,
      });
      return;
    }
    const owned = getOwnedTitles(interaction.guildId, interaction.user.id);
    await interaction.reply({
      content: `🏷️ 所持称号：${owned.map(getTitleName).join("、")}`,
      ephemeral: true,
    });
  },
};