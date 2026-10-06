/** 🔘 Interaction：募集参加ボタンの操作を処理します。 */

import type { ButtonHandler } from "../../core/client/command-types.js";
import { updateRecruitmentMembership } from "./recruitment.service.js";
import { buildRecruitmentPost } from "./recruitment.view.js";

const messages: Record<string, string> = {
  "already-joined": "✅ すでに参加しています。",
  "not-joined": "ℹ️ まだ参加していません。",
  full: "✅ 募集人数に達しています。",
  closed: "🏁 この募集は終了しています。",
  "closed-by-owner": "🏁 募集を終了しました。",
  missing: "🔎 募集が見つかりません。",
  owner: "👑 主催者は退出できません。募集を終了してください。",
  "not-owner": "👑 募集を終了できるのは主催者だけです。",
};
export function createRecruitmentButtonHandler(kind: "lfg" | "vc"): ButtonHandler {
  const prefix = `recruitment:${kind}:`;
  return {
    matches: (customId) => customId.startsWith(prefix),
    async execute(interaction) {
      const [, , action, postId] = interaction.customId.split(":");
      if (action !== "join" && action !== "leave" && action !== "close") {
        await interaction.reply({ content: "⚠️ 無効な操作です。", ephemeral: true });
        return;
      }
      const { result, post } = updateRecruitmentMembership(postId, interaction.user.id, action);
      if (!post || (result !== "joined" && result !== "closed-by-owner")) {
        await interaction.reply({
          content: messages[result] ?? "❌ 参加状態を更新できませんでした。",
          ephemeral: true,
        });
        return;
      }
      await interaction.update(buildRecruitmentPost(post));
    },
  };
}