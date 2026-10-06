/** 🔁 旧Command互換層：VC募集操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { ChannelType, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { createRecruitmentButtonHandler } from "../recruitment.buttons.js";
import { createRecruitment, saveRecruitmentMessage } from "../recruitment.service.js";
import { buildRecruitmentPost } from "../recruitment.view.js";

export const command: BotCommand = {
  category: "recruitment",
  data: new SlashCommandBuilder()
    .setName("vc")
    .setDescription("VCメンバーを募集します")
    .addStringOption((option) =>
      option
        .setName("activity")
        .setDescription("VCで何をするか")
        .setRequired(true)
        .addChoices(
          { name: "雑談", value: "chat" },
          { name: "ゲーム", value: "gaming" },
        ),
    )
    .addIntegerOption((option) =>
      option.setName("limit").setDescription("募集人数（主催者を含む）").setRequired(false).setMinValue(2).setMaxValue(20),
    )
    .addChannelOption((option) =>
      option.setName("channel").setDescription("参加先のボイスチャンネル").setRequired(false)
        .addChannelTypes(ChannelType.GuildVoice),
    ),
  buttonHandlers: [createRecruitmentButtonHandler("vc")],
  async execute(interaction) {
    if (!interaction.guildId || !interaction.channelId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const post = createRecruitment({
      kind: "vc",
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      voiceChannelId: interaction.options.getChannel("channel")?.id,
      ownerId: interaction.user.id,
      activity: interaction.options.getString("activity", true),
      capacity: interaction.options.getInteger("limit") ?? 10,
    });
    await interaction.reply(buildRecruitmentPost(post));
    const message = await interaction.fetchReply();
    saveRecruitmentMessage(post.id, message.id);
  },
};