/** 🎯 公開入口：/recruit。ゲーム・VC募集機能をまとめて公開します。 */

import type { BotCommand } from "../core/client/command-types.js";
import { createAggregateCommand } from "../core/client/command-aggregate.js";
import { command as lfg } from "../modules/recruitment/lfg/lfg.command.js";
import { command as vc } from "../modules/recruitment/vc/vc.command.js";
export const command: BotCommand = createAggregateCommand("recruit", "ゲーム募集・VC募集をまとめて利用します", "recruitment", [
  { command: lfg }, { command: vc },
]);
