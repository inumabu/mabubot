/** 👂 Listener：一時VCのDiscordイベントを処理し、既存機能へ接続します。 */

import { Events, type Client } from "discord.js";
import {
  cleanEmptyTempChannel,
  listTempVoiceChannels,
  removeTempVoiceRecord,
} from "./tempvc.service.js";
import { formatError, logger } from "../../../shared/logger.js";

export function registerTempVoiceListener(client: Client): void {
  client.on(Events.VoiceStateUpdate, async (oldState) => {
    const channel = oldState.channel;
    if (!channel || channel.members.size > 0) return;
    try {
      await cleanEmptyTempChannel(channel);
    } catch (error) {
      logger.error("tempvc", "❌ 空のチャンネル削除に失敗しました", {
        channelId: channel.id,
        error: formatError(error),
      });
    }
  });

  client.on(Events.ChannelDelete, (channel) => {
    removeTempVoiceRecord(channel.id);
  });

  client.once(Events.ClientReady, async () => {
    for (const record of listTempVoiceChannels()) {
      const guild = client.guilds.cache.get(record.guildId);
      const channel = guild?.channels.cache.get(record.channelId);
      if (!channel || !channel.isVoiceBased()) {
        removeTempVoiceRecord(record.channelId);
        continue;
      }
      try {
        await cleanEmptyTempChannel(channel);
      } catch (error) {
        logger.error("tempvc", "❌ 起動時のチャンネル整理に失敗しました", {
          channelId: channel.id,
          error: formatError(error),
        });
      }
    }
  });
}
