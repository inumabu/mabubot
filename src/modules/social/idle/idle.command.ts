/** 🔁 旧Command互換層：放置ステータス操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand, ButtonHandler } from "../../../core/client/command-types.js";
import {
  clearIdleActivity,
  getIdleMembers,
  setIdleActivity,
} from "./idle.service.js";
import { buildIdleBoard } from "./idle.view.js";
import type { IdleActivity } from "./idle.repository.js";

const buttonHandler: ButtonHandler = {
  matches: (customId) => customId === "idle:clear" || customId.startsWith("idle:set:"),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }

    const [, action, activity] = interaction.customId.split(":");
    const members = action === "clear"
      ? clearIdleActivity(interaction.guildId, interaction.user.id)
      : setIdleActivity(interaction.guildId, interaction.user.id, activity as IdleActivity);
    await interaction.update(buildIdleBoard(members));
  },
};

export const command: BotCommand = {
  category: "social",
  data: new SlashCommandBuilder()
    .setName("idle")
    .setDescription("暇なメンバーを募集します"),
  buttonHandlers: [buttonHandler],
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    await interaction.reply(buildIdleBoard(getIdleMembers(interaction.guildId)));
  },
};