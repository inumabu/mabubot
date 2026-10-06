/** 🔁 旧Command互換層：アイテムギフト操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { giftItem, transferPoints } from "../economy.facade.js";
import { findShopItem, shopItems } from "../shop/shop.catalog.js";

export const command: BotCommand = {
  category: "economy",
  data: new SlashCommandBuilder()
    .setName("gift")
    .setDescription("まぶPまたはアイテムを贈ります")
    .addUserOption((option) => option.setName("user").setDescription("贈る相手").setRequired(true))
    .addIntegerOption((option) =>
      option.setName("points").setDescription("贈るまぶP（1〜10000）").setRequired(false).setMinValue(1).setMaxValue(10000),
    )
    .addStringOption((option) =>
      option.setName("item").setDescription("贈るアイテム").setRequired(false)
        .addChoices(...shopItems.map(({ id, name }) => ({ name, value: id }))),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true });
      return;
    }
    const recipient = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("points");
    const itemId = interaction.options.getString("item");
    if (recipient.bot || recipient.id === interaction.user.id || (amount === null) === (itemId === null)) {
      await interaction.reply({ content: "⚠️ Botや自分には贈れません。pointsかitemのどちらか一方を指定してください。", ephemeral: true });
      return;
    }
    const item = itemId ? findShopItem(itemId) : undefined;
    if (itemId && !item) {
      await interaction.reply({ content: "⚠️ そのアイテムは贈れません。", ephemeral: true });
      return;
    }
    const result = amount !== null
      ? transferPoints(interaction.guildId, interaction.user.id, recipient.id, amount)
      : giftItem(interaction.guildId, interaction.user.id, recipient.id, item!.id);
    const description = amount !== null ? `${amount} まぶP` : item!.name;
    await interaction.reply({
      content: result === "ok"
        ? `🎁 ${recipient} に ${description} を贈りました。`
        : result === "insufficient"
          ? "🪙 残高または所持数が足りません。"
          : "❌ 贈り物を処理できませんでした。",
      ephemeral: true,
    });
  },
};
