/** ⚙️ Service：ガチャの業務ルールとユースケースを担当します。 */

import { drawGacha } from "../economy.facade.js";

export const gachaCost = 50;

const drops = [
  { itemId: "moon_sticker", name: "月のステッカー", rarity: "N", weight: 45 },
  { itemId: "star_sticker", name: "星のステッカー", rarity: "N", weight: 35 },
  { itemId: "night_badge", name: "深夜バッジ", rarity: "R", weight: 15 },
  { itemId: "mabu_crown", name: "まぶクラウン", rarity: "SSR", weight: 5 },
] as const;

export function rollGacha(): (typeof drops)[number] {
  const roll = Math.random() * drops.reduce((total, drop) => total + drop.weight, 0);
  let cursor = 0;
  return drops.find((drop) => {
    cursor += drop.weight;
    return roll < cursor;
  }) ?? drops[0];
}

export function performGacha(guildId: string, userId: string) {
  const drop = rollGacha();
  return { result: drawGacha(guildId, userId, drop.itemId, gachaCost), drop };
}