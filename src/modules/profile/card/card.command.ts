/** 🔁 旧Command互換層：カード操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { getInventory, getPoints } from "../../economy/economy.facade.js";
import { findShopItem } from "../../economy/shop/shop.catalog.js";
import { countThanks } from "../../social/thanks/thanks.service.js";
import { getProfile } from "../profile.service.js";
import { buildProfileEmbed } from "../profile.view.js";
import { GameStatsRepository } from "../../fun/game/game-stats.repository.js";
const gameStats = new GameStatsRepository();

export const command: BotCommand = {
  category: "profile",
  data: new SlashCommandBuilder()
    .setName("card")
    .setDescription("自分やメンバーのまぶカードを表示します")
    .addUserOption((option) => option.setName("user").setDescription("表示するメンバー").setRequired(false)),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const user = interaction.options.getUser("user") ?? interaction.user;
    const inventory = getInventory(interaction.guildId, user.id);
    const embed = buildProfileEmbed(
      getProfile(interaction.guildId, user.id),
      getPoints(interaction.guildId, user.id),
      countThanks(interaction.guildId, user.id),
      inventory.reduce((total, item) => total + item.quantity, 0),
      true,
    );
    const collection = inventory
      .map(({ itemId, quantity }) => `${findShopItem(itemId)?.name ?? itemId} ×${quantity}`)
      .join("、");
    if (collection) embed.addFields({ name: "🎁 コレクション", value: collection.slice(0, 1000) });
    const stats = gameStats.getUserStats(interaction.guildId, user.id);
    if (stats.length) {
      const wins = stats.reduce((total, stat) => total + stat.wins, 0);
      const score = stats.reduce((total, stat) => total + stat.score, 0);
      const plays = stats.reduce((total, stat) => total + stat.plays, 0);
      embed.addFields({ name: "🎮 ゲーム実績", value: `🏆 ${wins}勝  ·  🎯 ${score}pt  ·  ▶️ ${plays}` });
    }
    await interaction.reply({ embeds: [embed] });
  },
};
