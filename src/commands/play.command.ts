/** 🎯 公開入口：/play。ゲーム・釣り・レイド機能をまとめて公開します。 */

import type { BotCommand } from "../core/client/command-types.js";
import { createAggregateCommand } from "../core/client/command-aggregate.js";
import { command as fishing } from "../modules/fun/fishing/fishing.command.js";
import { command as game } from "../modules/fun/game/game.command.js";
import { command as mystery } from "../modules/fun/mystery/mystery.command.js";
import { command as quiz } from "../modules/fun/quiz/quiz.command.js";
import { command as race } from "../modules/fun/race/race.command.js";
import { command as raid } from "../modules/fun/raid/raid.command.js";
import { command as reaction } from "../modules/fun/reaction/reaction.command.js";
import { command as wolf } from "../modules/fun/wolf/wolf.command.js";
export const command: BotCommand = createAggregateCommand("play", "ミニゲーム・釣り・レイドをまとめて遊びます", "fun", [
  { command: game }, { command: mystery }, { command: quiz }, { command: fishing }, { command: race }, { command: raid }, { command: reaction }, { command: wolf },
]);
