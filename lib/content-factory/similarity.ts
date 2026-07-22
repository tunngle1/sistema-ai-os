const STOP_WORDS = new Set([
  "и", "в", "на", "с", "по", "для", "что", "как", "это", "не", "вы", "за", "от", "до", "из", "или", "а", "но",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/** Jaccard similarity 0..1 */
export function semanticSimilarity(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export function maxSimilarity(text: string, corpus: string[]): number {
  let max = 0;
  for (const other of corpus) {
    max = Math.max(max, semanticSimilarity(text, other));
  }
  return max;
}
