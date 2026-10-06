/** 📚 定義カタログ：ショップで使う固定値を管理します。 */

export const shopItems = [
  { id: "moon_sticker", name: "月のステッカー", description: "カードに飾れる月のステッカー", cost: 100 },
  { id: "star_sticker", name: "星のステッカー", description: "カードに飾れる星のステッカー", cost: 100 },
  { id: "night_badge", name: "深夜バッジ", description: "夜更かし仲間のバッジ", cost: 250 },
  { id: "mabu_crown", name: "まぶクラウン", description: "特別なコレクションアイテム", cost: 1000 },
] as const;

export function findShopItem(itemId: string) {
  return shopItems.find((item) => item.id === itemId);
}