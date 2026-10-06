/** 🎯 公開入口：/economy。まぶP・報酬・ショップ機能をまとめて公開します。 */

import type { BotCommand } from "../core/client/command-types.js";
import { createAggregateCommand } from "../core/client/command-aggregate.js";
import { command as gacha } from "../modules/economy/gacha/gacha.command.js";
import { command as gift } from "../modules/economy/gift/gift.command.js";
import { command as mission } from "../modules/economy/mission/mission.command.js";
import { command as points } from "../modules/economy/points/points.command.js";
import { command as shop } from "../modules/economy/shop/shop.command.js";
export const command: BotCommand = createAggregateCommand("economy", "まぶP・ショップ・ガチャ・ミッション・ギフトをまとめて利用します", "economy", [
  { command: points }, { command: gacha }, { command: mission }, { command: shop }, { command: gift },
]);
