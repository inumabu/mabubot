/** 💾 Storage基盤：画像の保存・取得と安全なパス検証を担当します。 */

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dataDirectory } from "./data-directory.js";

const imageDirectory = join(dataDirectory, "images");
const maxImageBytes = 8 * 1024 * 1024;
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function storeImage(url: string, expectedContentType: string): Promise<string> {
  const contentType = expectedContentType.split(";")[0].trim().toLowerCase();
  const extension = extensions[contentType];
  if (!extension) throw new Error("UNSUPPORTED_IMAGE_TYPE");

  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error("IMAGE_DOWNLOAD_FAILED");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > maxImageBytes) throw new Error("IMAGE_TOO_LARGE");

  const imageKey = `${randomUUID()}.${extension}`;
  await mkdir(imageDirectory, { recursive: true });
  await writeFile(join(imageDirectory, imageKey), buffer, { flag: "wx" });
  return imageKey;
}

export function getStoredImagePath(imageKey: string): string {
  if (!/^[0-9a-f-]{36}\.(jpg|png|gif|webp)$/.test(imageKey)) {
    throw new Error("INVALID_IMAGE_KEY");
  }
  return join(imageDirectory, imageKey);
}