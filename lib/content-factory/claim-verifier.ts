import type { QcCheckResult } from "@/lib/content-factory/types";

const FABRICATED_PATTERNS = [
  /100\s*%\s*гарант/i,
  /точно\s+заработ/i,
  /станешь\s+миллионер/i,
  /без\s+усилий/i,
  /единственн(ый|ая)\s+в\s+мире/i,
  /научно\s+доказано\s+что\s+вы/i,
  /все\s+участники\s+обязательно/i,
];

export function checkAccuracy(text: string): QcCheckResult {
  for (const pattern of FABRICATED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        name: "accuracy",
        passed: false,
        message: `Запрещённое обещание: ${pattern.source}`,
      };
    }
  }
  return { name: "accuracy", passed: true };
}

export function checkClaimSource(
  text: string,
  claims: Array<{ id: string; claimText: string; verificationStatus: string }>,
): QcCheckResult {
  const verified = claims.filter((c) => c.verificationStatus === "verified");
  if (verified.length === 0) {
    return { name: "claim_source", passed: false, message: "Нет верифицированных claims" };
  }

  const lower = text.toLowerCase();
  const linked = verified.filter((c) => {
    const words = c.claimText.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    return words.some((w) => lower.includes(w));
  });

  if (linked.length === 0) {
    return {
      name: "claim_source",
      passed: false,
      message: "Тезисы не связаны с верифицированными claims",
    };
  }

  return {
    name: "claim_source",
    passed: true,
    message: `Связано claims: ${linked.length}`,
  };
}
