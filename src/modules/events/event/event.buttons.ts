/** 🔘 Interaction：イベントのButton/Component操作を処理します。 */

import type { ButtonHandler } from "../../../core/client/command-types.js";
import { updateEvent } from "./event.service.js";
import { buildEventPost } from "./event.view.js";

const messages: Record<string, string> = {
  "already-joined": "✅ すでに参加しています。",
  "not-joined": "ℹ️ まだ参加していません。",
  cancelled: "❌ このイベントはキャンセル済みです。",
  missing: "🔎 イベントが見つかりません。",
  "not-owner": "👑 イベントをキャンセルできるのは主催者だけです。",
};

export const eventButtonHandler: ButtonHandler = {
  matches: (customId) => customId.startsWith("event:"),
  async execute(interaction) {
    const [, action, eventId] = interaction.customId.split(":");
    if (action !== "join" && action !== "leave" && action !== "cancel") {
      await interaction.reply({ content: "⚠️ 無効な操作です。", ephemeral: true });
      return;
    }
    const { result, event } = updateEvent(eventId, interaction.user.id, action);
    if (!event || (result !== "updated" && result !== "cancelled")) {
      await interaction.reply({ content: messages[result], ephemeral: true });
      return;
    }
    await interaction.update(buildEventPost(event));
  },
};