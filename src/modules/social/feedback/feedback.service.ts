/** ⚙️ Service：フィードバックの業務ルールとユースケースを担当します。 */

import { FeedbackRepository } from "./feedback.repository.js";

const repository = new FeedbackRepository();

export function submitFeedback(guildId: string, category: string, message: string): string {
  return repository.create(guildId, category, message);
}