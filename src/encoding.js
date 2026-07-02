import { readFile, writeFile } from "node:fs/promises";

const MOJIBAKE_PATTERNS = [
  /\uFFFD/,
  /Ã[\x80-\xBF]/,
  /Â[\x80-\xBF]?/,
  /ì[\x80-\xBF]{1,2}/,
  /í[\x80-\xBF]{1,2}/,
  /ë[\x80-\xBF]{1,2}/
];

export async function readUtf8(path) {
  return readFile(path, { encoding: "utf8" });
}

export async function writeUtf8(path, content) {
  await writeFile(path, content, { encoding: "utf8" });
}

export function hasUtf8Bom(content) {
  return content.charCodeAt(0) === 0xfeff;
}

export function findMojibakeIndicators(content) {
  return MOJIBAKE_PATTERNS.filter((pattern) => pattern.test(content)).map((pattern) => pattern.source);
}
