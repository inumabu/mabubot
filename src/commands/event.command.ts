/** 🎯 公開入口：/event。イベント・投票・写真機能をまとめて公開します。 */

import type { BotCommand } from "../core/client/command-types.js";
import { createAggregateCommand } from "../core/client/command-aggregate.js";
import { command as celebrate } from "../modules/events/celebrate/celebrate.command.js";
import { command as event } from "../modules/events/event/event.command.js";
import { command as photo } from "../modules/events/photo/photo.command.js";
import { command as poll } from "../modules/events/poll/poll.command.js";
export const command: BotCommand = createAggregateCommand("event", "イベント・投票・写真・記念日をまとめて利用します", "events", [
  { command: event }, { command: celebrate }, { command: photo }, { command: poll },
]);
