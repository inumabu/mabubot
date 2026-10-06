/** ⚙️ Service：一時VCの業務ルールとユースケースを担当します。 */

import {
  ChannelType,
  PermissionFlagsBits,
  type Guild,
  type VoiceBasedChannel,
  type VoiceChannel,
} from "discord.js";
import { env } from "../../../env.js";
import { formatError, logger } from "../../../shared/logger.js";
import { TempVoiceRepository } from "./tempvc.repository.js";

const repository = new TempVoiceRepository();

export async function createTempVoiceChannel(input: {
  guild: Guild;
  ownerId: string;
  ownerName: string;
  name?: string;
  limit?: number;
}): Promise<VoiceChannel> {
  const botMember = input.guild.members.me;
  if (
    !botMember?.permissions.has(PermissionFlagsBits.ManageChannels)
    || !botMember.permissions.has(PermissionFlagsBits.MoveMembers)
  ) {
    throw new Error("MISSING_MANAGE_CHANNELS");
  }
  const owner = await input.guild.members.fetch(input.ownerId);
  const sourceChannel = owner.voice.channel;
  if (!sourceChannel) throw new Error("OWNER_NOT_IN_VOICE");

  const categoryId = env.tempVcCategoryId ?? sourceChannel.parentId ?? undefined;
  const channel = await input.guild.channels.create({
    name: input.name?.trim() || `${input.ownerName}'s Room`,
    type: ChannelType.GuildVoice,
    parent: categoryId,
    userLimit: input.limit ?? 0,
    permissionOverwrites: [
      {
        id: input.guild.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
      },
      {
        id: input.ownerId,
        allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels],
      },
    ],
    reason: `Temporary voice channel for ${input.ownerName}`,
  });

  let isTracked = false;
  try {
    repository.create(channel.id, input.guild.id, input.ownerId);
    isTracked = true;
    await owner.voice.setChannel(channel, "Join newly created temporary voice channel");
  } catch (error) {
    try {
      await channel.delete("Failed to register temporary voice channel");
      repository.remove(channel.id);
    } catch (cleanupError) {
      if (!isTracked) {
        try {
          repository.create(channel.id, input.guild.id, input.ownerId);
        } catch (trackingError) {
          logger.error("tempvc", "❌ 孤立チャンネルの記録に失敗しました", {
            channelId: channel.id,
            error: formatError(trackingError),
          });
        }
      }
      logger.error("tempvc", "❌ チャンネルのロールバックに失敗しました", {
        channelId: channel.id,
        error: formatError(cleanupError),
      });
    }
    throw error;
  }
  return channel;
}

export async function cleanEmptyTempChannel(channel: VoiceBasedChannel): Promise<boolean> {
  if (!repository.find(channel.id) || channel.members.size > 0) return false;
  await channel.delete("Temporary voice channel became empty");
  repository.remove(channel.id);
  return true;
}

export function removeTempVoiceRecord(channelId: string): void {
  repository.remove(channelId);
}

export function listTempVoiceChannels() {
  return repository.list();
}
