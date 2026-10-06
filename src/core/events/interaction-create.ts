/** 🧠 Interaction Router：Slash CommandとComponentを既存Handlerへ振り分けます。 */

import {
  Events,
  type AnySelectMenuInteraction,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Client,
  type ModalSubmitInteraction,
} from "discord.js";
import type {
  BotCommand,
  ModalHandler,
  SelectMenuHandler,
} from "../client/command-types.js";
import { AnalyticsRepository } from "../../modules/community/analytics.repository.js";
import { formatError, logger } from "../../shared/logger.js";

type ComponentInteraction = ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction;
const analytics = new AnalyticsRepository();

// 🔀 Interaction境界を一元化し、CommandとComponent Handlerで同じ実行契約を使います。
export function registerInteractionCreate(
  client: Client,
  commands: ReadonlyMap<string, BotCommand>,
): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isAutocomplete()) {
      const command = commands.get(interaction.commandName);
      if (command?.autocomplete) {
        try {
          await command.autocomplete(interaction);
        } catch (error) {
          logger.error("interaction", "⚠️ Autocomplete 処理に失敗しました", {
            command: interaction.commandName,
            error: formatError(error),
          });
          await interaction.respond([]);
        }
      } else {
        await interaction.respond([]);
      }
      return;
    }

    if (interaction.isButton()) {
      const handler = [...commands.values()]
        .flatMap((command) => command.buttonHandlers ?? [])
        .find((candidate) => candidate.matches(interaction.customId));
      if (!handler) {
        await interaction.reply({
          content: "⚠️ このボタンは利用できません。",
          ephemeral: true,
        });
        return;
      }
      try {
        await handler.execute(interaction);
      } catch (error) {
        logger.error("interaction", "⚠️ Button 処理に失敗しました", {
          customId: interaction.customId,
          error: formatError(error),
        });
        await replyComponentError(interaction);
      }
      return;
    }

    if (interaction.isAnySelectMenu()) {
      const handler = findSelectMenuHandler(commands, interaction.customId);
      if (!handler) {
        await interaction.reply({ content: "⚠️ この選択メニューは利用できません。", ephemeral: true });
        return;
      }
      try {
        await handler.execute(interaction);
      } catch (error) {
        logger.error("interaction", "⚠️ Select Menu 処理に失敗しました", {
          customId: interaction.customId,
          error: formatError(error),
        });
        await replyComponentError(interaction);
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      const handler = findModalHandler(commands, interaction.customId);
      if (!handler) {
        await interaction.reply({ content: "⚠️ このフォームは利用できません。", ephemeral: true });
        return;
      }
      try {
        await handler.execute(interaction);
      } catch (error) {
        logger.error("interaction", "⚠️ Modal 処理に失敗しました", {
          customId: interaction.customId,
          error: formatError(error),
        });
        await replyComponentError(interaction);
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) {
      await interaction.reply({
        content: "⚠️ このコマンドは利用できません。",
        ephemeral: true,
      });
      return;
    }

    await executeCommand(command, interaction, commands);
  });
}

function findSelectMenuHandler(
  commands: ReadonlyMap<string, BotCommand>,
  customId: string,
): SelectMenuHandler | undefined {
  return [...commands.values()]
    .flatMap((command) => command.selectMenuHandlers ?? [])
    .find((handler) => handler.matches(customId));
}

function findModalHandler(
  commands: ReadonlyMap<string, BotCommand>,
  customId: string,
): ModalHandler | undefined {
  return [...commands.values()]
    .flatMap((command) => command.modalHandlers ?? [])
    .find((handler) => handler.matches(customId));
}

async function replyComponentError(interaction: ComponentInteraction): Promise<void> {
  const response = {
    content: "⚠️ 操作に失敗しました。時間をおいて再度お試しください。",
    ephemeral: true,
  };
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(response);
  } else {
    await interaction.reply(response);
  }
}

async function executeCommand(
  command: BotCommand,
  interaction: ChatInputCommandInteraction,
  commands: ReadonlyMap<string, BotCommand>,
): Promise<void> {
  const startedAt = Date.now();
  logger.debug("command", "▶️ 処理を開始しました", {
    command: interaction.commandName,
    guildId: interaction.guildId ?? "direct-message",
    userId: interaction.user.id,
  });
  try {
    await command.execute(interaction, { commands });
    const latencyMs = Date.now() - startedAt;
    recordAnalytics(interaction, true, latencyMs);
    logger.info("command", "✅ 処理が完了しました", {
      command: interaction.commandName,
      latencyMs,
      guildId: interaction.guildId ?? "direct-message",
    });
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    logger.error("command", "❌ 処理に失敗しました", {
      command: interaction.commandName,
      latencyMs,
      guildId: interaction.guildId ?? "direct-message",
      error: formatError(error),
    });
    recordAnalytics(interaction, false, latencyMs);
    const response = {
      content: "❌ コマンドの実行中にエラーが発生しました。",
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response);
    } else {
      await interaction.reply(response);
    }
  }
}

function recordAnalytics(
  interaction: ChatInputCommandInteraction,
  success: boolean,
  latencyMs: number,
): void {
  try {
    analytics.record(interaction.guildId, interaction.user.id, interaction.commandName, success, latencyMs);
  } catch (error) {
    logger.error("analytics", "❌ 利用統計の記録に失敗しました", {
      command: interaction.commandName,
      error: formatError(error),
    });
  }
}
