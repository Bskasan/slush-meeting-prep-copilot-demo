import { MIN_CHARS } from "../schemas";

/**
 * Lightweight heuristic to reject obvious garbage / low-signal text before calling the LLM.
 * Thresholds are relaxed so real profiles (with numbers, symbols, short paragraphs) pass.
 */
export function isLowSignalText(text: string): boolean {
  const t = text.trim();
  if (t.length < MIN_CHARS) return true;

  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 5) return true;

  const uniqueChars = new Set(t).size;
  if (t.length > 200 && uniqueChars / t.length < 0.05) return true;

  const nonLetterCount = t.replace(/\s/g, "").replace(/[a-zA-Z]/g, "").length;
  const totalNonSpace = t.replace(/\s/g, "").length;
  if (totalNonSpace > 30 && nonLetterCount / totalNonSpace > 0.75) return true;

  const wordCounts = new Map<string, number>();
  for (const w of words) {
    wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
  }
  const maxCount = Math.max(...wordCounts.values());
  if (words.length >= 15 && maxCount / words.length > 0.65) return true;

  if (hasHugeRepeatedBlock(t)) return true;

  return false;
}

/**
 * Reject text with a large repeated block (e.g. same substring repeated many times).
 */
export function hasHugeRepeatedBlock(text: string): boolean {
  const len = text.length;
  if (len < 200) return false;
  const blockSize = 100;
  const firstBlock = text.slice(0, blockSize);
  let count = 0;
  for (let i = 0; i + blockSize <= len; i += blockSize) {
    if (text.slice(i, i + blockSize) === firstBlock) count++;
    else break;
  }
  return count >= 5;
}
