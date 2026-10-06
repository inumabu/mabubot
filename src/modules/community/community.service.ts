/** ⚙️ Service：コミュニティ向けマッチング・統計処理の業務ルールを担当します。 */

import { countOpenRecruitments, listRecruitments, countRecruitmentsSince } from "../recruitment/recruitment.service.js";
import { getIdleMembers } from "../social/idle/idle.service.js";
import { countThanksSince } from "../social/thanks/thanks.service.js";
import { listEvents, countEventsSince } from "../events/event/event.service.js";
import { getTokyoDate } from "../../shared/time/tokyo-date.js";

export type MatchType = "gaming" | "chat" | "vc";

function getTodayStart(): string {
  return new Date(`${getTokyoDate()}T00:00:00+09:00`).toISOString();
}

export function getMatchResults(guildId: string, type: MatchType) {
  const activity = type === "gaming" ? "games" : type;
  return {
    members: getIdleMembers(guildId).filter((member) => member.activity === activity),
    recruitments: type === "gaming" ? listRecruitments(guildId, "lfg") : [],
  };
}

export function getCommunitySnapshot(guildId: string) {
  const today = getTodayStart();
  return {
    lfgOpen: countOpenRecruitments(guildId, "lfg"),
    vcOpen: countOpenRecruitments(guildId, "vc"),
    idleCount: getIdleMembers(guildId).length,
    nextEvent: listEvents(guildId)[0],
    lfgToday: countRecruitmentsSince(guildId, "lfg", today),
    vcToday: countRecruitmentsSince(guildId, "vc", today),
    eventsToday: countEventsSince(guildId, today),
    thanksToday: countThanksSince(guildId, today),
  };
}