/** 🎨 View：プロフィール情報のDiscord表示データを組み立てます。 */

import { EmbedBuilder } from "discord.js";
import { getTitleName } from "./title/title.catalog.js";
import type { UserProfile } from "./profile.repository.js";

export function buildProfileEmbed(
  profile: UserProfile,
  balance: number,
  thanksReceived: number,
  inventoryCount: number,
  card = false,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(card ? 0x668f88 : 0x5b8c85)
    .setTitle(card ? "🌙 まぶカード" : "👤 まぶプロフィール")
    .setDescription(`<@${profile.userId}> · ${getTitleName(profile.equippedTitle)}`)
    .addFields(
      { name: "⭐ Level", value: `${profile.level}`, inline: true },
      { name: "✨ XP", value: `${profile.currentLevelXp} / ${profile.nextLevelXp}`, inline: true },
      { name: "🪙 まぶP", value: balance.toLocaleString("ja-JP"), inline: true },
      { name: "🔥 Streak", value: `${profile.streakCount}日`, inline: true },
      { name: "🙏 Thanks", value: `${thanksReceived}回`, inline: true },
      { name: "🎁 アイテム", value: `${inventoryCount}個`, inline: true },
    );
  return embed;
}