/** 🔁 旧Command互換層：リアクション操作の既存入力・実行契約を維持し、統合公開Commandから再利用します。 */

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from "discord.js";
import type { BotCommand, ButtonHandler } from "../../../core/client/command-types.js";
import { answerReaction, startReaction } from "../arcade.service.js";
import { gameColors, gameEmbed } from "../fun.view.js";
const tokens = ["moon", "heart", "star"] as const;
const emoji: Record<typeof tokens[number], string> = { moon: "🌙", heart: "❤️", star: "⭐" };
const reactionButtonHandler: ButtonHandler = {
  matches: (customId) => customId.startsWith("reaction:answer:"),
  async execute(interaction) {
    if (!interaction.guildId) { await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true }); return; }
    const token = interaction.customId.split(":")[2];
    const result = answerReaction(interaction.guildId, interaction.user.id, emoji[token as typeof tokens[number]] ?? "");
    if (result.status === "won") await interaction.update({ embeds: [gameEmbed("⚡ 早押し結果", `<@${result.winnerId}> が正解！\n+${result.points} まぶP`, gameColors.reaction)], content: "", components: [] });
    else if (result.status === "wrong") await interaction.reply({ content: "❌ 違う絵文字です！", ephemeral: true });
    else await interaction.reply({ content: result.status === "expired" ? "🏁 このゲームは終了しました。" : `🏆 勝者は <@${result.winnerId}> です。`, ephemeral: true });
  },
};
export const command: BotCommand = {
  category: "fun",
  data: new SlashCommandBuilder().setName("reaction").setDescription("絵文字リアクション早押しを開始します"),
  buttonHandlers: [reactionButtonHandler],
  async execute(interaction) {
    if (!interaction.guildId) { await interaction.reply({ content: "🏠 サーバー内で使用してください。", ephemeral: true }); return; }
    const prompt = startReaction(interaction.guildId);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...tokens.map((token) => new ButtonBuilder().setCustomId(`reaction:answer:${token}`).setLabel(emoji[token]).setStyle(ButtonStyle.Secondary)),
    );
    await interaction.reply({ embeds: [gameEmbed("⚡ 早押し", `${prompt.prompt}\n\n正解：+20 まぶP`, gameColors.reaction)], components: [row] });
  },
};
