/** 🔁 旧Command互換層：釣り操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { castFishing, fishCatalog } from "../arcade.service.js";
import { gameColors, gameEmbed } from "../fun.view.js";
import { getInventory } from "../../economy/economy.facade.js";
export const command: BotCommand = {
  category: "fun",
  data: new SlashCommandBuilder().setName("fishing").setDescription("釣りをして魚を集めます")
    .addSubcommand((subcommand) => subcommand.setName("cast").setDescription("釣りをします"))
    .addSubcommand((subcommand) => subcommand.setName("book").setDescription("魚図鑑を確認します")),
  async execute(interaction) {
    if (!interaction.guildId) { await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true }); return; }
    if (interaction.options.getSubcommand() === "book") {
      const inventory = getInventory(interaction.guildId, interaction.user.id);
      const caught = new Map(inventory.filter(({ itemId }) => itemId.startsWith("fish_")).map(({ itemId, quantity }) => [itemId, quantity]));
      const count = fishCatalog.filter((fish) => caught.has(fish.id)).length;
      const lines = fishCatalog.map((fish) => `${caught.has(fish.id) ? "✅" : "⬜"} ${fish.name} · ${caught.get(fish.id) ?? 0}`);
      await interaction.reply({ embeds: [gameEmbed(`📖 魚図鑑 · ${count}/${fishCatalog.length}`, lines.join("\n"), gameColors.fishing)], ephemeral: true });
      return;
    }
    const result = castFishing(interaction.guildId, interaction.user.id);
    await interaction.reply({ embeds: [gameEmbed(result.status === "cooldown" ? "🎣 待機中" : "🎣 釣れた！", result.status === "cooldown" ? `あと **${result.remaining}秒**` : `**${result.fish.name}** · ${result.fish.rarity}\n+${result.fish.points} まぶP`, gameColors.fishing)], ephemeral: true });
  },
};
