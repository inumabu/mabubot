/** 📥 Command Loader：公開Commandだけを読み込み、Discord登録対象を確定します。 */

import { readdir } from "node:fs/promises";
import { pathToFileURL, fileURLToPath } from "node:url";
import type { BotCommand } from "./command-types.js";

// 📥 統合後はこのディレクトリのCommandだけをDiscordへ直接公開します。
const commandsDirectory = fileURLToPath(new URL("../../commands/", import.meta.url));

async function findCommandFiles(directory: string): Promise<string[]> {
  const entries = (await readdir(directory, { withFileTypes: true }))
    .sort((left, right) => left.name.localeCompare(right.name));
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return findCommandFiles(path);
    return entry.isFile() && /\.command\.(ts|js)$/.test(entry.name) ? [path] : [];
  }));
  return nested.flat();
}

// 🔒 Command名を重複チェックし、公開入口を一意に保ちます。
export async function loadCommands(): Promise<Map<string, BotCommand>> {
  const commandFiles = await findCommandFiles(commandsDirectory);
  const commands = new Map<string, BotCommand>();
  for (const file of commandFiles) {
    const loadedModule = (await import(pathToFileURL(file).href)) as { command?: BotCommand };
    const command = loadedModule.command;
    if (!command?.data?.name || typeof command.execute !== "function") throw new Error(`Invalid command module: ${file}`);
    if (commands.has(command.data.name)) throw new Error(`Duplicate command name: ${command.data.name}`);
    commands.set(command.data.name, command);
  }
  return commands;
}
