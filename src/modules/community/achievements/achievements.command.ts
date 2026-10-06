/** 🔁 旧Command互換層：実績操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { GameStatsRepository } from "../../fun/game/game-stats.repository.js";
const repository = new GameStatsRepository();
const rules = [{ icon:"🎮", name:"ゲーム初心者", need:1, text:"1プレイ" }, { icon:"🏆", name:"ゲーム王", need:20, text:"20勝" }, { icon:"🎯", name:"熟練者", need:100, text:"100pt" }];
export const command: BotCommand = { category: "community", data: new SlashCommandBuilder().setName("achievements").setDescription("ゲーム実績を表示します").addUserOption((o) => o.setName("user").setDescription("対象メンバー")), async execute(interaction) { if (!interaction.guildId) { await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true }); return; } const user = interaction.options.getUser("user") ?? interaction.user; const stats = repository.getUserStats(interaction.guildId,user.id); const plays=stats.reduce((n,s)=>n+s.plays,0), wins=stats.reduce((n,s)=>n+s.wins,0), score=stats.reduce((n,s)=>n+s.score,0); const values=[plays,wins,score]; await interaction.reply({ embeds: [{ title:`🏅 ${user.displayName}の実績`, description: rules.map((r,i)=>`${values[i] >= r.need ? "✅" : "⬜"} ${r.icon} ${r.name} · ${r.text}`).join("\n"), color:0xd28a50 }] }); } };
