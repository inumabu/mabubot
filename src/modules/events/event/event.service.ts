/** ⚙️ Service：イベントの業務ルールとユースケースを担当します。 */

import {
  EventRepository,
  type EventActionResult,
  type EventRecord,
} from "./event.repository.js";

const repository = new EventRepository();

export function createEvent(input: {
  guildId: string;
  channelId: string;
  ownerId: string;
  name: string;
  startsAt: string;
  description?: string;
}): EventRecord {
  return repository.create(input);
}

export function saveEventMessage(id: string, messageId: string): void {
  repository.setMessageId(id, messageId);
}

export function listEvents(guildId: string): EventRecord[] {
  return repository.listOpen(guildId);
}

export function countEventsSince(guildId: string, since: string): number {
  return repository.countCreatedSince(guildId, since);
}

export function listDueEventReminders(from: string, until: string): EventRecord[] {
  return repository.listDueReminders(from, until);
}

export function markEventReminderSent(eventId: string): void {
  repository.markReminderSent(eventId);
}

export function updateEvent(
  id: string,
  userId: string,
  action: "join" | "leave" | "cancel",
): { result: EventActionResult; event?: EventRecord } {
  const result = action === "join"
    ? repository.join(id, userId)
    : action === "leave"
      ? repository.leave(id, userId)
      : repository.cancel(id, userId);
  return { result, event: repository.findById(id) };
}