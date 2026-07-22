import { checkProductGuard } from "@/lib/tz/product-guard";
import { checkAccuracy, checkClaimSource } from "@/lib/content-factory/claim-verifier";
import { checkDuplicate } from "@/lib/content-factory/duplicate-checker";
import { checkCtaTracking, checkPlatformRules } from "@/lib/content-factory/platform-rules";
import { checkReputation, checkVoice } from "@/lib/content-factory/style-checker";
import type { FactoryDerivative, QcReport } from "@/lib/content-factory/types";
import { maxSimilarity } from "@/lib/content-factory/similarity";

export function runQcPipeline(params: {
  derivative: Omit<FactoryDerivative, "qc" | "status" | "blockReason" | "similarityScore" | "requiresHumanApproval">;
  claims: Array<{ id: string; claimText: string; verificationStatus: string }>;
  existingTexts: string[];
  leaderName: string;
  utm: string;
  verticalPublishedCount: number;
  approvalMode: string;
}): Pick<FactoryDerivative, "qc" | "status" | "blockReason" | "similarityScore" | "requiresHumanApproval"> {
  const fullText = `${params.derivative.topic} ${params.derivative.hook} ${params.derivative.postText} ${params.derivative.script}`;

  const checks = [
    (() => {
      const g = checkProductGuard(fullText);
      return {
        name: "product_guard" as const,
        passed: g.allowed,
        message: g.reason,
      };
    })(),
    checkClaimSource(fullText, params.claims),
    checkAccuracy(fullText),
    checkVoice(fullText, params.leaderName),
    checkDuplicate(fullText, params.existingTexts),
    checkPlatformRules({
      platform: params.derivative.platform,
      unitType: params.derivative.unitType,
      postText: params.derivative.postText,
      aspectRatio: params.derivative.aspectRatio,
      durationSec: params.derivative.durationSec,
    }),
    checkReputation(fullText),
    checkCtaTracking(params.utm, params.derivative.ctaType),
  ];

  const failed = checks.filter((c) => !c.passed);
  const similarityScore = maxSimilarity(fullText, params.existingTexts);

  const qc: QcReport = {
    passed: failed.length === 0,
    checks,
    blockedBy: failed[0]?.name,
  };

  const isVertical = params.derivative.unitType === "vertical_short";
  const underHumanLimit =
    params.verticalPublishedCount < 100 || !params.derivative.isPrimaryVertical;

  const requiresHumanApproval =
    params.approvalMode !== "A" ||
    isVertical ||
    !underHumanLimit ||
    params.derivative.isPrimaryVertical;

  let status = "VERIFICATION";
  let blockReason: string | undefined;

  if (!qc.passed) {
    status = "BLOCKED";
    blockReason = failed.map((f) => f.message).filter(Boolean).join("; ");
  } else if (requiresHumanApproval) {
    status = "HUMAN_REVIEW";
  } else if (params.approvalMode === "A") {
    status = "SCHEDULED";
  } else {
    status = "HUMAN_REVIEW";
  }

  return { qc, status, blockReason, similarityScore, requiresHumanApproval };
}
