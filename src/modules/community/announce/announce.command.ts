/** 🔁 旧Command互換層：告知操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../../../core/client/command-types.js";
export const command: BotCommand = { category:"community", data:new SlashCommandBuilder().setName("announce").setDescription("このチャンネルへ告知します").setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addStringOption((o)=>o.setName("text").setDescription("告知内容").setRequired(true).setMaxLength(1000)), async execute(interaction){ if(!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)){await interaction.reply({content:"🛡️ Manage Messages権限が必要です。",ephemeral:true});return;} const text=interaction.options.getString("text",true); await interaction.reply({embeds:[{title:"📢 お知らせ",description:text,color:0x5b8cba}]}); } };
