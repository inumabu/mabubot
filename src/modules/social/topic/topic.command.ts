/** 🔁 旧Command互換層：トピック操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { getRandomTopic, type TopicCategory } from "./topic.service.js";

export const command: BotCommand = {
  category: "social",
  data: new SlashCommandBuilder()
    .setName("topic")
    .setDescription("雑談のお題をランダムに表示します")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("お題のカテゴリ")
        .setRequired(false)
        .addChoices(
          { name: "ランダム", value: "random" },
          { name: "ゲーム", value: "games" },
          { name: "音楽", value: "music" },
          { name: "日常", value: "daily" },
          { name: "ネタ", value: "fun" },
        ),
    ),
  async execute(interaction) {
    const category = (interaction.options.getString("category") ?? "random") as TopicCategory;
    await interaction.reply(`💬 ${getRandomTopic(category)}`);
  },
};