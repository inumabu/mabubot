/** ⚙️ Service：Thanksの業務ルールとユースケースを担当します。 */

import { ThanksRepository } from "./thanks.repository.js";

const repository = new ThanksRepository();

export function sendThanks(guildId: string, senderId: string, recipientId: string, message?: string) {
  return repository.create(guildId, senderId, recipientId, message);
}

export function countThanks(guildId: string, userId: string): number {
  return repository.countReceived(guildId, userId);
}

export function countThanksSince(guildId: string, since: string): number {
  return repository.countSince(guildId, since);
}