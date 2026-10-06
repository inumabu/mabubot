/** ⚙️ Service：プロフィール情報・経験値・称号操作のユースケース境界を担当します。 */

import { ProfileRepository } from "./profile.repository.js";

const repository = new ProfileRepository();

export function getProfile(guildId: string, userId: string) {
  return repository.getProfile(guildId, userId);
}

export function setBirthday(guildId: string, userId: string, monthDay: string | null): void {
  repository.setBirthday(guildId, userId, monthDay);
}

export function listBirthdays(monthDay: string) {
  return repository.listBirthdays(monthDay);
}

export function wasBirthdayAnnounced(guildId: string, date: string, userId: string): boolean {
  return repository.wasBirthdayAnnounced(guildId, date, userId);
}

export function markBirthdayAnnounced(guildId: string, date: string, userId: string): void {
  repository.markBirthdayAnnounced(guildId, date, userId);
}

export function getOwnedTitles(guildId: string, userId: string): string[] {
  return repository.listTitles(guildId, userId);
}

export function equipTitle(guildId: string, userId: string, titleId: string): boolean {
  return repository.equipTitle(guildId, userId, titleId);
}