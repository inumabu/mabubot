/** 🎯 公開入口：/community。交流・統計・コミュニティ機能をまとめて公開します。 */

import type { BotCommand } from "../core/client/command-types.js";
import { createAggregateCommand } from "../core/client/command-aggregate.js";
import { command as analytics } from "../modules/community/analytics/analytics.command.js";
import { command as announce } from "../modules/community/announce/announce.command.js";
import { command as digest } from "../modules/community/digest/digest.command.js";
import { command as leaderboard } from "../modules/community/leaderboard/leaderboard.command.js";
import { command as match } from "../modules/community/match/match.command.js";
import { command as note } from "../modules/community/note/note.command.js";
import { command as remind } from "../modules/community/remind/remind.command.js";
import { command as stats } from "../modules/community/stats/stats.command.js";
import { command as status } from "../modules/community/status/status.command.js";
import { command as ticket } from "../modules/community/ticket/ticket.command.js";
import { command as weekly } from "../modules/community/weekly/weekly.command.js";
import { command as feedback } from "../modules/social/feedback/feedback.command.js";
import { command as idle } from "../modules/social/idle/idle.command.js";
import { command as thanks } from "../modules/social/thanks/thanks.command.js";
import { command as topic } from "../modules/social/topic/topic.command.js";
import { command as hello } from "../modules/onboarding/hello/hello.command.js";
export const command: BotCommand = createAggregateCommand("community", "交流・マッチング・統計・コミュニティ機能をまとめて利用します", "community", [
  { command: hello }, { command: topic }, { command: idle }, { command: thanks }, { command: feedback }, { command: match }, { command: leaderboard }, { command: digest }, { command: weekly }, { command: stats }, { command: status }, { command: announce }, { command: analytics }, { command: note }, { command: remind }, { command: ticket },
]);
