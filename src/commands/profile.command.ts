/** 🎯 公開入口：/profile。プロフィール・実績・称号機能をまとめて公開します。 */

import type { BotCommand } from "../core/client/command-types.js";
import { createAggregateCommand } from "../core/client/command-aggregate.js";
import { command as achievements } from "../modules/community/achievements/achievements.command.js";
import { command as birthday } from "../modules/profile/birthday/birthday.command.js";
import { command as card } from "../modules/profile/card/card.command.js";
import { command as level } from "../modules/profile/level/level.command.js";
import { command as profile } from "../modules/profile/profile/profile.command.js";
import { command as streak } from "../modules/profile/streak/streak.command.js";
import { command as title } from "../modules/profile/title/title.command.js";
export const command: BotCommand = createAggregateCommand("profile", "プロフィール・レベル・称号・実績をまとめて確認します", "profile", [
  { command: profile, route: "view" }, { command: card }, { command: level }, { command: birthday }, { command: streak }, { command: achievements }, { command: title },
]);
