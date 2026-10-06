/** 🔁 旧Command互換層：ゲーム募集操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { createRecruitmentButtonHandler } from "../recruitment.buttons.js";
import { createRecruitment, saveRecruitmentMessage } from "../recruitment.service.js";
import { buildRecruitmentPost } from "../recruitment.view.js";

const games = ["Minecraft", "Valorant", "Apex Legends", "Overwatch 2", "Fortnite", "その他"];

export const command: BotCommand = {
  category: "recruitment",
  data: new SlashCommandBuilder()
    .setName("lfg")
    .setDescription("ゲームメンバーを募集します")
    .addStringOption((option) =>
      option.setName("game").setDescription("ゲーム名").setRequired(true).setAutocomplete(true),
    )
    .addIntegerOption((option) =>
      option.setName("members").setDescription("募集人数（主催者を含む）").setRequired(true).setMinValue(2).setMaxValue(20),
    )
    .addStringOption((option) =>
      option.setName("time").setDescription("開始時刻（例: 22:00）").setRequired(false).setMaxLength(30),
    )
    .addStringOption((option) =>
      option.setName("note").setDescription("ひとことメモ").setRequired(false).setMaxLength(200),
    ),
  autocomplete: async (interaction) => {
    const search = interaction.options.getFocused().toLocaleLowerCase("ja");
    await interaction.respond(
      games
        .filter((game) => game.toLocaleLowerCase("ja").includes(search))
        .slice(0, 25)
        .map((game) => ({ name: game, value: game })),
    );
  },
  buttonHandlers: [createRecruitmentButtonHandler("lfg")],
  async execute(interaction) {
    if (!interaction.guildId || !interaction.channelId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const post = createRecruitment({
      kind: "lfg",
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      ownerId: interaction.user.id,
      activity: interaction.options.getString("game", true),
      capacity: interaction.options.getInteger("members", true),
      startTime: interaction.options.getString("time") ?? undefined,
      note: interaction.options.getString("note") ?? undefined,
    });
    await interaction.reply(buildRecruitmentPost(post));
    const message = await interaction.fetchReply();
    saveRecruitmentMessage(post.id, message.id);
  },
};