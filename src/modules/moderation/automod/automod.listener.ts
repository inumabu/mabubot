/** 👂 Listener：AutoModのDiscordイベントを処理し、既存機能へ接続します。 */

import { Events, PermissionFlagsBits, type Client, type Message } from "discord.js";
import { CommunityToolsRepository } from "../../community/tools.repository.js";
const repository = new CommunityToolsRepository();
export function registerAutoModListener(client: Client): void {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (!message.guildId || message.author.bot || !message.member) return;
    if (repository.get(message.guildId, "automod.enabled") !== "true") return;
    if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;
    const words = (repository.get(message.guildId, "automod.words") ?? "").split(",").filter(Boolean);
    if (!words.some((word) => message.content.toLocaleLowerCase().includes(word.toLocaleLowerCase()))) return;
    await message.delete().catch(() => undefined);
    if (!message.channel.isTextBased() || !("send" in message.channel)) return;
    const notice = await message.channel.send({ content: `🛡️ <@${message.author.id}> 禁止語を含むメッセージを削除しました。` }).catch(() => undefined);
    if (notice) setTimeout(() => notice.delete().catch(() => undefined), 5000);
  });
}
