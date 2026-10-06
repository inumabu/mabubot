/** 🔁 旧Command互換層：週間ランキング操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { GameStatsRepository } from "../../fun/game/game-stats.repository.js";
const repository = new GameStatsRepository();
export const command: BotCommand = { category: "community", data: new SlashCommandBuilder().setName("weekly").setDescription("ゲームランキングを表示します"), async execute(interaction) { if (!interaction.guildId) { await interaction.reply({ content:"🏠 サーバー内で使用してください。", ephemeral:true }); return; } const rows=repository.getWinsLeaderboard(interaction.guildId,"all",10); await interaction.reply({ embeds:[{ title:"📅 週間ゲームランキング", description:rows.length ? rows.map((r,i)=>`${["🥇","🥈","🥉"][i]??`▫️${i+1}`} <@${r.userId}> **${r.wins}勝**`).join("\n") : "📅 まだ記録がありません。", color:0xf2b84b, footer:{text:"🏆 期間集計の基盤を準備中 · 現在の実績を表示"} }] }); } };
