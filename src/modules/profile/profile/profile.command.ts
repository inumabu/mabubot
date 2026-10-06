/** 🔁 旧Command互換層：プロフィール操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { getInventory, getPoints } from "../../economy/economy.facade.js";
import { countThanks } from "../../social/thanks/thanks.service.js";
import { getProfile } from "../profile.service.js";
import { buildProfileEmbed } from "../profile.view.js";

export const command: BotCommand = {
  category: "profile",
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("まぶ鯖での活動プロフィールを表示します")
    .addUserOption((option) =>
      option.setName("user").setDescription("確認するメンバー").setRequired(false),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const user = interaction.options.getUser("user") ?? interaction.user;
    const profile = getProfile(interaction.guildId, user.id);
    const inventory = getInventory(interaction.guildId, user.id);
    await interaction.reply({
      embeds: [buildProfileEmbed(
        profile,
        getPoints(interaction.guildId, user.id),
        countThanks(interaction.guildId, user.id),
        inventory.reduce((total, item) => total + item.quantity, 0),
      )],
    });
  },
};