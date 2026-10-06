/** 🎯 公開入口：/moderation。管理・設定・監査機能をまとめて公開します。 */

import type { BotCommand } from "../core/client/command-types.js";
import { createAggregateCommand } from "../core/client/command-aggregate.js";
import { command as automod } from "../modules/moderation/automod/automod.command.js";
import { command as config } from "../modules/moderation/config/config.command.js";
import { command as modlog } from "../modules/moderation/modlog/modlog.command.js";
export const command: BotCommand = createAggregateCommand("moderation", "サーバー管理・AutoMod・設定をまとめて利用します", "moderation", [
  { command: automod }, { command: config }, { command: modlog },
]);
