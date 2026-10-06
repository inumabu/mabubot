/** 👂 Listener：ウェルカムのDiscordイベントを処理し、既存機能へ接続します。 */

import { Events, type Client, type GuildMember } from "discord.js";
import { env } from "../../../env.js";
import { CommunityToolsRepository } from "../../community/tools.repository.js";
const repository = new CommunityToolsRepository();
const defaults = {
  title: "🌙 ようこそ、{user}さん！",
  message: "このサーバーへようこそ！\n\n🎮 ゲーム：`/play game`\n📚 使い方：`/help`\n👤 カード：`/profile card`",
  tutorial: "まずはこの3つから！\n\n1️⃣ `/help`　機能を見る\n2️⃣ `/profile card`　プロフィールを見る\n3️⃣ `/profile streak checkin:true`　今日のログイン報酬",
};
export interface WelcomeContent { title: string; message: string; tutorial: string; }
export function buildWelcomeContent(displayName: string, settings: (key: string) => string | undefined): WelcomeContent {
  return {
    title: (settings("welcome.title") ?? defaults.title).replaceAll("{user}", displayName),
    message: settings("welcome.message") ?? defaults.message,
    tutorial: settings("welcome.tutorial") ?? defaults.tutorial,
  };
}
export function registerWelcomeListener(client: Client): void {
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    const content = buildWelcomeContent(member.user.displayName, (key) => repository.get(member.guild.id, key));
    const channel = env.welcomeChannelId ? await member.guild.channels.fetch(env.welcomeChannelId).catch(() => undefined) : member.guild.systemChannel;
    if (channel?.isTextBased() && "send" in channel) await channel.send({ embeds: [{ title: content.title, description: content.message, color: 0x617f77 }] }).catch(() => undefined);
    await member.send({ embeds: [{ title: "🌱 チュートリアル", description: content.tutorial, color: 0x698c6b, footer: { text: "困ったら /help" } }] }).catch(() => undefined);
  });
}
