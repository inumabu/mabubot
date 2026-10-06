/** ⚙️ Service：Streakの業務ルールとユースケースを担当します。 */

import { StreakRepository } from "./streak.repository.js";

const repository = new StreakRepository();

export function recordStreakCheckin(guildId: string, userId: string, date: string) {
  return repository.checkIn(guildId, userId, date);
}