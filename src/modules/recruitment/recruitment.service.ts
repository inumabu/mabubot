/** ⚙️ Service：募集作成・参加・退出・終了の業務ルールを担当します。 */

import {
  RecruitmentRepository,
  type MembershipResult,
  type RecruitmentKind,
  type RecruitmentPost,
} from "./recruitment.repository.js";

const repository = new RecruitmentRepository();

export function createRecruitment(input: {
  kind: RecruitmentKind;
  guildId: string;
  channelId: string;
  voiceChannelId?: string;
  ownerId: string;
  activity: string;
  capacity: number;
  startTime?: string;
  note?: string;
}): RecruitmentPost {
  return repository.create(input);
}

export function saveRecruitmentMessage(id: string, messageId: string): void {
  repository.setMessageId(id, messageId);
}

export function listRecruitments(guildId: string, kind: RecruitmentKind): RecruitmentPost[] {
  return repository.listOpen(guildId, kind);
}

export function countRecruitmentsSince(guildId: string, kind: RecruitmentKind, since: string): number {
  return repository.countCreatedSince(guildId, kind, since);
}

export function countOpenRecruitments(guildId: string, kind: RecruitmentKind): number {
  return repository.countOpen(guildId, kind);
}

export function updateRecruitmentMembership(
  id: string,
  userId: string,
  action: "join" | "leave" | "close",
): { result: MembershipResult; post?: RecruitmentPost } {
  const result = action === "join"
    ? repository.join(id, userId)
    : action === "leave"
      ? repository.leave(id, userId)
      : repository.close(id, userId);
  return { result, post: repository.findById(id) };
}