/** 🎨 View：ゲーム全体のDiscord表示データを組み立てます。 */

import { EmbedBuilder } from "discord.js";

export const gameColors = {
  mystery: 0x8b78b8,
  quiz: 0x5b8cba,
  wolf: 0x8c667d,
  reaction: 0xd28a50,
  race: 0x668f88,
  fishing: 0x4d9ab3,
  raid: 0xb35c5c,
} as const;

export function gameEmbed(title: string, description: string, color: number): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setFooter({ text: "🎮 まぶBot · ミニゲーム" });
}

export function progressBar(value: number, max: number, length = 12): string {
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const filled = Math.round(ratio * length);
  return `${"█".repeat(filled)}${"░".repeat(length - filled)}`;
}
