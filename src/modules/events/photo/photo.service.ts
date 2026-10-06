/** ⚙️ Service：写真の業務ルールとユースケースを担当します。 */

import { PhotoRepository } from "./photo.repository.js";
import { getTokyoDate } from "../../../shared/time/tokyo-date.js";

const repository = new PhotoRepository();

export function addPhoto(guildId: string, userId: string, imageKey: string, caption?: string) {
  return repository.create(guildId, userId, imageKey, caption);
}

export function getTodayPhoto(guildId: string) {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  return repository.listRecent(guildId, since)
    .find((photo) => getTokyoDate(new Date(photo.createdAt)) === getTokyoDate());
}