/** ⚙️ Service：記念日の業務ルールとユースケースを担当します。 */

import { CelebrateRepository } from "./celebrate.repository.js";

const repository = new CelebrateRepository();

export function createCelebration(input: {
  guildId: string;
  ownerId: string;
  title: string;
  startsAt: string;
  description?: string;
}) {
  return repository.create(input);
}

export function listCelebrations(guildId: string) {
  return repository.list(guildId);
}