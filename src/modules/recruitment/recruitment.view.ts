/** 🎨 View：募集投稿のDiscord表示データを組み立てます。 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import type { RecruitmentPost } from "./recruitment.repository.js";

export function buildRecruitmentPost(post: RecruitmentPost) {
  const isLfg = post.kind === "lfg";
  const embed = new EmbedBuilder()
    .setTitle(isLfg ? `🎮 ${post.activity} メンバー募集` : "🔊 VCメンバー募集中！")
    .setColor(isLfg ? 0x6a9d73 : 0x6c8fb2)
    .addFields(
      { name: isLfg ? "👥 募集人数" : "🎮 活動", value: isLfg ? `${post.memberIds.length}/${post.capacity}人` : post.activity, inline: true },
      ...(isLfg && post.startTime ? [{ name: "🕒 開始", value: post.startTime, inline: true }] : []),
      { name: "👥 参加中", value: post.memberIds.map((userId) => `<@${userId}>`).join("、"), inline: false },
    )
    .setFooter({ text: `主催: ${post.ownerId} | ID: ${post.id}` });

  if (post.note) embed.addFields({ name: "📝 メモ", value: post.note });
  if (post.kind === "vc" && post.voiceChannelId) {
    embed.addFields({ name: "🔊 参加先VC", value: `<#${post.voiceChannelId}>`, inline: true });
  }
  if (post.memberIds.length >= post.capacity) embed.setDescription("✅ 募集人数に達しました。");
  if (post.status !== "open") embed.setDescription("🏁 この募集は終了しました。");

  const components = [
    new ButtonBuilder()
      .setCustomId(`recruitment:${post.kind}:join:${post.id}`)
      .setLabel("参加")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success)
      .setDisabled(post.status !== "open" || post.memberIds.length >= post.capacity),
    new ButtonBuilder()
      .setCustomId(`recruitment:${post.kind}:leave:${post.id}`)
      .setLabel("退出")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(post.status !== "open"),
    new ButtonBuilder()
      .setCustomId(`recruitment:${post.kind}:close:${post.id}`)
      .setLabel("募集を終了")
      .setEmoji("🏁")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(post.status !== "open"),
  ];
  if (post.kind === "vc" && post.voiceChannelId) {
    components.push(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${post.guildId}/${post.voiceChannelId}`)
        .setLabel("VCへ移動")
        .setEmoji("🔊"),
    );
  }
  return {
    embeds: [embed],
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(components)],
  };
}