/** 🔁 旧Command互換層：統計操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { getCommunitySnapshot } from "../community.service.js";
import { raidStatus } from "../../fun/arcade.service.js";
import { progressBar } from "../../fun/fun.view.js";
export const command: BotCommand = { category: "community", data: new SlashCommandBuilder().setName("stats").setDescription("サーバー統計を表示します"), async execute(interaction) { if (!interaction.guildId) { await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true }); return; } const s = getCommunitySnapshot(interaction.guildId); const r = raidStatus(interaction.guildId); await interaction.reply({ embeds: [{ title: "📊 サーバー統計", description: `🎮 募集 **${s.lfgToday}** · 🔊 VC **${s.vcToday}**\n🎉 Events **${s.eventsToday}** · 🙏 Thanks **${s.thanksToday}**\n\n🐉 Raid\n${progressBar(r.hp,r.maxHp)} ${r.hp}/${r.maxHp} HP`, color: 0x668f88 }] }); } };
