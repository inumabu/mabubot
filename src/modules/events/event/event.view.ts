/** 🎨 View：イベントのDiscord表示データを組み立てます。 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import type { EventRecord } from "./event.repository.js";

export function buildEventPost(event: EventRecord) {
  const startsAt = new Date(event.startsAt);
  const visibleMembers = event.memberIds.slice(0, 25);
  const remainingMembers = event.memberIds.length - visibleMembers.length;
  const embed = new EmbedBuilder()
    .setTitle(`🎉 ${event.name}`)
    .setColor(event.status === "open" ? 0xd28a50 : 0x888888)
    .addFields(
      { name: "🗓️ 開始日時", value: new Intl.DateTimeFormat("ja-JP", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Tokyo",
      }).format(startsAt), inline: true },
      {
        name: "参加者",
        value: `${visibleMembers.map((userId) => `<@${userId}>`).join("、")}${remainingMembers > 0 ? `、ほか${remainingMembers}人` : ""}`,
        inline: false,
      },
    )
    .setFooter({ text: `主催: ${event.ownerId}` });

  if (event.description) embed.setDescription(`📝 ${event.description}`);
  if (event.status !== "open") embed.setDescription("❌ このイベントはキャンセルされました。");

  const components = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`event:join:${event.id}`)
      .setLabel("参加する")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success)
      .setDisabled(event.status !== "open"),
    new ButtonBuilder()
      .setCustomId(`event:leave:${event.id}`)
      .setLabel("参加を取り消す")
      .setEmoji("↩️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(event.status !== "open"),
    new ButtonBuilder()
      .setCustomId(`event:cancel:${event.id}`)
      .setLabel("主催者キャンセル")
      .setEmoji("🛑")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(event.status !== "open"),
  );
  return { embeds: [embed], components: [components] };
}

export function buildEventList(events: EventRecord[]) {
  const embed = new EmbedBuilder()
    .setTitle("🎉 開催予定のイベント（直近15件）")
    .setColor(0xd28a50)
    .setDescription(
      events.length
        ? events.map((event) => {
          const date = new Intl.DateTimeFormat("ja-JP", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Tokyo",
          }).format(new Date(event.startsAt));
          return `**${event.name}** · ${date} · ${event.memberIds.length}人参加`;
        }).join("\n")
        : "📅 現在、開催予定のイベントはありません。",
    );
  return { embeds: [embed], ephemeral: true };
}