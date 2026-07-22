import { maxSimilarity } from "@/lib/content-factory/similarity";
import type { QcCheckResult } from "@/lib/content-factory/types";
import { FACTORY_DEFAULTS } from "@/lib/content-factory/types";

export function checkDuplicate(
  text: string,
  existingTexts: string[],
  threshold = FACTORY_DEFAULTS.similarityThreshold,
): QcCheckResult {
  const score = maxSimilarity(text, existingTexts);
  if (score >= threshold) {
    return {
      name: "uniqueness",
      passed: false,
      message: `Смысловой дубль (similarity ${(score * 100).toFixed(0)}%, порог ${(threshold * 100).toFixed(0)}%)`,
    };
  }
  return {
    name: "uniqueness",
    passed: true,
    message: score > 0 ? `Similarity ${(score * 100).toFixed(0)}% — OK` : undefined,
  };
}
