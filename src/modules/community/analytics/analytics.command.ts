/** 🔁 旧Command互換層：Analytics操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
import { AnalyticsRepository } from "../analytics.repository.js";
const repository = new AnalyticsRepository();
export const command: BotCommand = { category: "community", data: new SlashCommandBuilder().setName("analytics").setDescription("コマンド利用統計を表示します").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addIntegerOption((o)=>o.setName("days").setDescription("集計日数（1〜90）").setMinValue(1).setMaxValue(90)), async execute(interaction){ if(!interaction.guildId || !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)){await interaction.reply({content:"🛡️ Manage Server権限が必要です。",ephemeral:true});return;} const days=interaction.options.getInteger("days")??30; const since=new Date(Date.now()-days*86400000).toISOString(); const rows=repository.summary(interaction.guildId,since,20); await interaction.reply({embeds:[{title:`📈 利用統計 · ${days}日`,description:rows.length?rows.map((r,i)=>`${i+1}. **/${r.commandName}**　${r.uses}回 · 失敗${r.failures} · ${r.averageLatencyMs}ms`).join("\n"):"📈 まだ利用記録がありません。",color:0x668f88,footer:{text:`合計 ${repository.total(interaction.guildId,since)}回`}}],ephemeral:true}); } };
