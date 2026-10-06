/** ⚙️ Service：放置ステータスの業務ルールとユースケースを担当します。 */

import { IdleRepository, type IdleActivity, type IdleMember } from "./idle.repository.js";

const repository = new IdleRepository();

export function getIdleMembers(guildId: string): IdleMember[] {
  return repository.listByGuild(guildId);
}

export function setIdleActivity(
  guildId: string,
  userId: string,
  activity: IdleActivity,
): IdleMember[] {
  repository.setActivity(guildId, userId, activity);
  return repository.listByGuild(guildId);
}

export function clearIdleActivity(guildId: string, userId: string): IdleMember[] {
  repository.clearActivity(guildId, userId);
  return repository.listByGuild(guildId);
}