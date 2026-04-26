import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..");

export async function readJson(filePath) {
  return JSON.parse(await fs.promises.readFile(filePath, "utf8"));
}

export async function writeJson(filePath, value) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function fileExists(filePath) {
  try {
    return (await fs.promises.stat(filePath)).isFile();
  } catch {
    return false;
  }
}

export function stringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function parseArgs(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith("-")) {
      positional.push(arg);
      continue;
    }
    if (["--json", "--help", "-h"].includes(arg)) {
      const key = arg.replace(/^--?/, "");
      flags[key === "h" ? "help" : key] = true;
      continue;
    }
    const [key, inline] = arg.replace(/^--/, "").split("=", 2);
    const value = inline ?? args[i + 1];
    if (inline === undefined) {
      if (value === undefined || String(value).startsWith("-")) throw new Error(`--${key} requires a value.`);
      i += 1;
    }
    flags[key] = value;
  }
  return { flags, positional };
}
