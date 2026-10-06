/** 🔁 旧Command互換層：ショップ操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { purchaseItem } from "../economy.facade.js";
import { findShopItem, shopItems } from "./shop.catalog.js";

export const command: BotCommand = {
  category: "economy",
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("まぶPショップを確認・利用します")
    .addStringOption((option) =>
      option
        .setName("buy")
        .setDescription("購入するアイテム")
        .setRequired(false)
        .addChoices(...shopItems.map(({ id, name }) => ({ name, value: id }))),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const itemId = interaction.options.getString("buy");
    if (!itemId) {
      await interaction.reply({
        embeds: [{
          title: "🛍️ まぶPショップ",
          description: shopItems.map((item) => `**${item.name}** · ${item.cost} まぶP\n${item.description}`).join("\n\n"),
          color: 0x668f88,
        }],
        ephemeral: true,
      });
      return;
    }
    const item = findShopItem(itemId);
    if (!item) {
      await interaction.reply({ content: "⚠️ そのアイテムは販売していません。", ephemeral: true });
      return;
    }
    const result = purchaseItem(interaction.guildId, interaction.user.id, item.id, item.cost);
    await interaction.reply({
      content: result === "ok"
        ? `🛍️ ${item.name} を購入しました。`
        : "🪙 まぶPが足りません。/economy points claim:true でデイリー報酬を受け取れます。",
      ephemeral: true,
    });
  },
};