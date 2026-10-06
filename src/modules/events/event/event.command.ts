/** 🔁 旧Command互換層：イベント操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { eventButtonHandler } from "./event.buttons.js";
import { createEvent, listEvents, saveEventMessage } from "./event.service.js";
import { buildEventList, buildEventPost } from "./event.view.js";

export const command: BotCommand = {
  category: "events",
  data: new SlashCommandBuilder()
    .setName("event")
    .setDescription("イベントを作成・確認します")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("イベントを作成します")
        .addStringOption((option) =>
          option.setName("name").setDescription("イベント名").setRequired(true).setMaxLength(100),
        )
        .addStringOption((option) =>
          option.setName("starts_at").setDescription("開始日時（ISO 8601、例: 2026-12-24T22:00+09:00）").setRequired(true).setMaxLength(40),
        )
        .addStringOption((option) =>
          option.setName("description").setDescription("イベントの説明").setRequired(false).setMaxLength(500),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("開催予定のイベントを表示します"),
    ),
  buttonHandlers: [eventButtonHandler],
  async execute(interaction) {
    if (!interaction.guildId || !interaction.channelId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }

    if (interaction.options.getSubcommand() === "list") {
      await interaction.reply(buildEventList(listEvents(interaction.guildId)));
      return;
    }

    const startsAtInput = interaction.options.getString("starts_at", true);
    const startsAt = new Date(startsAtInput);
    if (
      !/[zZ]|[+-]\d{2}:\d{2}$/.test(startsAtInput)
      || !Number.isFinite(startsAt.getTime())
      || startsAt.getTime() <= Date.now()
    ) {
      await interaction.reply({ content: "⏰ 未来の開始日時をISO 8601形式で入力してください。", ephemeral: true });
      return;
    }

    const name = interaction.options.getString("name", true).trim();
    if (!name) {
      await interaction.reply({ content: "📝 イベント名を入力してください。", ephemeral: true });
      return;
    }

    const event = createEvent({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      ownerId: interaction.user.id,
      name,
      startsAt: startsAt.toISOString(),
      description: interaction.options.getString("description")?.trim() || undefined,
    });
    await interaction.reply(buildEventPost(event));
    const message = await interaction.fetchReply();
    saveEventMessage(event.id, message.id);
  },
};