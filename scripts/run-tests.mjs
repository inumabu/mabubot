import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { spawn } from "node:child_process";

async function collectTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectTests(path));
    else if (entry.isFile() && entry.name.endsWith(".test.ts")) files.push(path);
  }
  return files.sort();
}

const tests = await collectTests("tests");
if (tests.length === 0) {
  console.error("❌ テストファイルが見つかりません。");
  process.exit(1);
}

const tsxCli = join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
const args = ["--experimental-sqlite", tsxCli, "--test", ...tests];
console.log(`🧪 ${tests.length}個のテストを実行します：${tests.map((file) => relative(process.cwd(), file)).join(", ")}`);

const child = spawn(process.execPath, args, { stdio: "inherit", shell: false });
child.once("error", (error) => {
  console.error("❌ テストプロセスを起動できませんでした。", error);
  process.exit(1);
});
child.once("exit", (code, signal) => {
  if (signal) {
    console.error(`❌ テストがシグナル ${signal} で終了しました。`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
