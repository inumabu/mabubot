/** 💾 Storage基盤：データ保存先を実行環境から独立して解決します。 */

import { resolve } from "node:path";

export function resolveDataDirectory(
  workingDirectory = process.cwd(),
  configuredPath = process.env.MABUBOT_DATA_DIR,
): string {
  return resolve(workingDirectory, configuredPath?.trim() || "data");
}

export const dataDirectory = resolveDataDirectory();