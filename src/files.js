import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") return false;
    throw error;
  }
}

export async function listMarkdownFiles(root) {
  const results = [];
  await walk(root, results);
  return results.filter((file) => file.endsWith(".md"));
}

export function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

async function walk(current, results) {
  if (!(await pathExists(current))) return;
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, results);
    } else {
      results.push(fullPath);
    }
  }
}
