/** ⏰ Job：定期実行処理と重複実行防止を担当します。 */

import { Events, type Client } from "discord.js";
import { env } from "../env.js";
import { getCommunitySnapshot } from "../modules/community/community.service.js";
import {
  listDueEventReminders,
  markEventReminderSent,
} from "../modules/events/event/event.service.js";
import { listBirthdays, markBirthdayAnnounced, wasBirthdayAnnounced } from "../modules/profile/profile.service.js";
import { getTokyoDate, getTokyoMonthDay } from "../shared/time/tokyo-date.js";
import { formatError, logger } from "../shared/logger.js";
import { JobRepository } from "./job.repository.js";
import { CommunityToolsRepository } from "../modules/community/tools.repository.js";

const jobRepository = new JobRepository();
const toolsRepository = new CommunityToolsRepository();
let started = false;
let jobRunning = false;

function getTokyoClock(): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  return {
    hour: Number(parts.find((part) => part.type === "hour")?.value),
    minute: Number(parts.find((part) => part.type === "minute")?.value),
  };
}

async function runBirthdayJob(client: Client, date: string): Promise<void> {
  if (!env.birthdayChannelId || jobRepository.hasRun("birthday", date)) return;
  const channel = await client.channels.fetch(env.birthdayChannelId);
  if (!channel?.isTextBased() || !("send" in channel) || !("guildId" in channel)) return;
  const birthdays = listBirthdays(getTokyoMonthDay())
    .filter((user) => user.guildId === channel.guildId && !wasBirthdayAnnounced(user.guildId, date, user.userId));
  if (!birthdays.length) {
    jobRepository.markRun("birthday", date);
    return;
  }
  await channel.send({
    content: `🎂 今日がお誕生日のメンバー：${birthdays.map(({ userId }) => `<@${userId}>`).join("、")} おめでとう！`,
    allowedMentions: { users: birthdays.map(({ userId }) => userId) },
  });
  for (const birthday of birthdays) markBirthdayAnnounced(birthday.guildId, date, birthday.userId);
  jobRepository.markRun("birthday", date);
  logger.info("jobs", "🎂 誕生日のお知らせを送信しました", { date, count: birthdays.length });
}

async function runDigestJob(client: Client, date: string): Promise<void> {
  if (!env.digestChannelId || jobRepository.hasRun("digest", date)) return;
  const channel = await client.channels.fetch(env.digestChannelId);
  if (!channel?.isTextBased() || !("send" in channel) || !("guildId" in channel)) return;
  const snapshot = getCommunitySnapshot(channel.guildId);
  await channel.send({
    embeds: [{
      title: `🌙 Mabuserver Daily · ${date}`,
      description: [
        `🎮 今日の募集：${snapshot.lfgToday}件`,
        `🔊 VC募集：${snapshot.vcToday}件`,
        `🎉 イベント作成：${snapshot.eventsToday}件`,
        `🙏 Thanks：${snapshot.thanksToday}件`,
        `💤 今暇：${snapshot.idleCount}人`,
      ].join("\n"),
      color: 0x617f77,
      footer: { text: `次のイベント: ${snapshot.nextEvent?.name ?? "なし"}` },
    }],
  });
  jobRepository.markRun("digest", date);
  logger.info("jobs", "📰 日次ダイジェストを送信しました", { date, guildId: channel.guildId });
}

async function runEventReminders(): Promise<void> {
  const now = Date.now();
  const from = new Date(now).toISOString();
  const until = new Date(now + 15 * 60 * 1000).toISOString();
  for (const event of listDueEventReminders(from, until)) {
    const channel = await eventChannel(event.channelId);
    if (!channel) continue;
    await channel.send({
      content: `⏰ <@${event.ownerId}> まもなく「${event.name}」の開始時刻です。`,
      allowedMentions: { users: [event.ownerId] },
    });
    markEventReminderSent(event.id);
    logger.info("jobs", "⏰ イベントリマインダーを送信しました", { eventId: event.id });
  }
}

async function runUserReminders(client: Client): Promise<void> {
  for (const reminder of toolsRepository.dueReminders(new Date().toISOString())) {
    const user = await client.users.fetch(reminder.userId).catch(() => undefined);
    if (!user) {
      logger.warn("jobs", "⚠️ リマインダーの送信先を取得できませんでした", { reminderId: reminder.id });
      continue;
    }
    const sent = await user.send(`⏰ リマインダー\n${reminder.content}`).then(() => true).catch((error) => {
      logger.error("jobs", "❌ リマインダーの送信に失敗しました", {
        reminderId: reminder.id,
        error: formatError(error),
      });
      return false;
    });
    if (sent) {
      toolsRepository.completeReminder(reminder.id);
      logger.info("jobs", "⏰ ユーザーリマインダーを送信しました", { reminderId: reminder.id });
    }
  }
}

async function eventChannel(channelId: string) {
  const channel = activeClient?.channels.cache.get(channelId);
  if (!channel?.isTextBased() || !("send" in channel)) return undefined;
  return channel;
}

let activeClient: Client | undefined;

export function registerScheduledJobs(client: Client): void {
  if (started) return;
  started = true;
  activeClient = client;
  client.once(Events.ClientReady, () => {
    logger.info("jobs", "🕒 スケジューラーを開始しました", { intervalMs: 60_000, timeZone: "Asia/Tokyo" });
    const run = async () => {
      if (jobRunning) return;
      jobRunning = true;
      try {
        const date = getTokyoDate();
        const { hour, minute } = getTokyoClock();
        if (hour === 9 && minute <= 5) {
          await runBirthdayJob(client, date).catch((error) => logger.error("jobs", "❌ 誕生日 Job に失敗しました", { error: formatError(error) }));
        }
        if (hour === 9 && minute >= 5 && minute <= 10) {
          await runDigestJob(client, date).catch((error) => logger.error("jobs", "❌ ダイジェスト Job に失敗しました", { error: formatError(error) }));
        }
        await runEventReminders().catch((error) => logger.error("jobs", "❌ イベントリマインダー Job に失敗しました", { error: formatError(error) }));
        await runUserReminders(client).catch((error) => logger.error("jobs", "❌ ユーザーリマインダー Job に失敗しました", { error: formatError(error) }));
      } finally {
        jobRunning = false;
      }
    };
    const timer = setInterval(() => void run(), 60_000);
    timer.unref();
    void run();
  });
}
