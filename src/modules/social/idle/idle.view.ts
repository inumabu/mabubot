/** 🎨 View：放置ステータスのDiscord表示データを組み立てます。 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import type { IdleActivity, IdleMember } from "./idle.repository.js";

const activities: { value: IdleActivity; label: string; emoji: string }[] = [
  { value: "games", label: "ゲームする", emoji: "🎮" },
  { value: "chat", label: "雑談する", emoji: "💬" },
  { value: "vc", label: "VCする", emoji: "🔊" },
];

export function buildIdleBoard(members: IdleMember[]) {
  const embed = new EmbedBuilder()
    .setTitle("💤 今暇なメンバー")
    .setColor(0x69a7ae)
    .setDescription(
      activities
        .map(({ value, label, emoji }) => {
          const matchingMembers = members
            .filter((member) => member.activity === value)
            .map((member) => member.userId);
          const visibleUsers = matchingMembers.slice(0, 20).map((userId) => `<@${userId}>`);
          const remainder = matchingMembers.length - visibleUsers.length;
          return `${emoji} **${label}**：${matchingMembers.length}人${visibleUsers.length ? `\n${visibleUsers.join("、")}` : ""}${remainder > 0 ? `\nほか${remainder}人` : ""}`;
        })
        .join("\n\n"),
    );

  const buttons = activities.map(({ value, label, emoji }) =>
    new ButtonBuilder()
      .setCustomId(`idle:set:${value}`)
      .setLabel(label)
      .setEmoji(emoji)
      .setStyle(ButtonStyle.Primary),
  );
  buttons.push(
    new ButtonBuilder()
      .setCustomId("idle:clear")
      .setLabel("解除")
      .setStyle(ButtonStyle.Secondary),
  );

  return {
    embeds: [embed],
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)],
  };
}