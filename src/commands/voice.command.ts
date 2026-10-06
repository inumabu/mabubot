/** 🎯 公開入口：/voice。一時VC機能をまとめて公開します。 */

import type { BotCommand } from "../core/client/command-types.js";
import { createAggregateCommand } from "../core/client/command-aggregate.js";
import { command as tempvc } from "../modules/voice/tempvc/tempvc.command.js";
export const command: BotCommand = createAggregateCommand("voice", "一時ボイスチャンネルを作成・管理します", "voice", [{ command: tempvc }]);
