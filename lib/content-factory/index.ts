import { prisma } from "@/lib/db";
import { logAgentAction } from "@/lib/ai/agents/base";
import type { GameAgentContext } from "@/lib/ai/agents/types";
import {
  buildSourceUnits,
  expandSourceToDerivatives,
  getCampaignDays,
} from "@/lib/content-factory/content-map";
import { runQcPipeline } from "@/lib/content-factory/qc-pipeline";
import type { FactoryDerivative } from "@/lib/content-factory/types";
import { CTA_TEXT } from "@/lib/content-factory/types";

export type ContentFactoryResult = {
  sourceUnitCount: number;
  derivativeCount: number;
  blockedCount: number;
  humanReviewCount: number;
};

export async function runContentFactory(params: {
  game: GameAgentContext;
  gameId: string;
  claimIds: string[];
  claims: Array<{ id: string; claimText: string; verificationStatus: string }>;
  approvalMode: string;
  verticalPublishedCount: number;
}): Promise<ContentFactoryResult> {
  const campaignDays = getCampaignDays(params.game);
  const landingPath = `/l/${params.game.slug}`;

  await prisma.contentSourceUnit.deleteMany({ where: { gameId: params.gameId } });
  await prisma.contentItem.deleteMany({ where: { gameId: params.gameId } });

  const sources = buildSourceUnits({
    game: params.game,
    claimIds: params.claimIds,
    campaignDays,
  });

  const existingTexts: string[] = [];
  const allDerivatives: FactoryDerivative[] = [];
  let contentIndex = 0;

  for (let si = 0; si < sources.length; si++) {
    const source = sources[si];
    const dbSource = await prisma.contentSourceUnit.create({
      data: {
        gameId: params.gameId,
        sourceId: source.sourceId,
        dayOffset: source.dayOffset,
        topic: source.topic,
        coreMessage: source.coreMessage,
        claimIds: JSON.stringify(source.claimIds),
        visualStyle: source.visualStyle,
        ctaType: source.ctaType,
        status: "APPROVED_SOURCE",
      },
    });

    const rawDerivatives = expandSourceToDerivatives({
      game: params.game,
      source,
      sourceIndex: si,
      landingPath,
    });

    for (const raw of rawDerivatives) {
      contentIndex++;
      const utm = `utm_source=${raw.platform.toLowerCase()}&utm_medium=social&utm_campaign=${params.gameId}&utm_content=${contentIndex}&cta=${raw.ctaType}`;

      const qcResult = runQcPipeline({
        derivative: {
          ...raw,
          cta: CTA_TEXT[raw.ctaType],
          shootBrief: raw.shootBrief,
          script: raw.script,
          postText: raw.postText,
        },
        claims: params.claims,
        existingTexts,
        leaderName: params.game.leaderName,
        utm,
        verticalPublishedCount: params.verticalPublishedCount,
        approvalMode: params.approvalMode,
      });

      const derivative: FactoryDerivative = {
        ...raw,
        cta: CTA_TEXT[raw.ctaType],
        qc: qcResult.qc,
        status: qcResult.status,
        blockReason: qcResult.blockReason,
        similarityScore: qcResult.similarityScore,
        requiresHumanApproval: qcResult.requiresHumanApproval,
      };

      existingTexts.push(`${derivative.topic} ${derivative.hook} ${derivative.postText}`);

      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + derivative.dayOffset);
      const [h, m] = derivative.time.split(":");
      scheduledAt.setHours(Number(h), Number(m), 0, 0);

      await prisma.contentItem.create({
        data: {
          gameId: params.gameId,
          sourceUnitId: dbSource.id,
          contentId: `${params.gameId}-C${String(contentIndex).padStart(4, "0")}`,
          unitType: derivative.unitType,
          platform: derivative.platform,
          formatType: derivative.formatType,
          topic: derivative.topic,
          hook: derivative.hook,
          cta: derivative.cta,
          ctaType: derivative.ctaType,
          visualStyle: derivative.visualStyle,
          aspectRatio: derivative.aspectRatio,
          durationSec: derivative.durationSec,
          isPrimaryVertical: derivative.isPrimaryVertical,
          isCrossPublish: derivative.isCrossPublish,
          shootBrief: derivative.shootBrief,
          script: derivative.script,
          postText: derivative.postText,
          landingUrl: landingPath,
          utm,
          claimIds: JSON.stringify(derivative.claimIds),
          approvalMode: params.approvalMode,
          scheduledAt,
          status: derivative.status,
          blockReason: derivative.blockReason,
          qcResults: JSON.stringify(derivative.qc),
          similarityScore: derivative.similarityScore,
          requiresHumanApproval: derivative.requiresHumanApproval,
        },
      });

      allDerivatives.push(derivative);
    }
  }

  const blockedCount = allDerivatives.filter((d) => d.status === "BLOCKED").length;
  const humanReviewCount = allDerivatives.filter((d) => d.status === "HUMAN_REVIEW").length;

  await logAgentAction(
    params.gameId,
    "content_editor",
    "ai",
    `Контентная фабрика: ${sources.length} source units → ${allDerivatives.length} адаптаций`,
    { blockedCount, humanReviewCount, campaignDays },
  );

  await logAgentAction(params.gameId, "verifier", "ai", "QC pipeline: claims + accuracy", {
    passed: allDerivatives.filter((d) => d.qc.passed).length,
  });
  await logAgentAction(params.gameId, "verifier", "ai", "Duplicate checker завершён", {
    blocked: blockedCount,
  });

  return {
    sourceUnitCount: sources.length,
    derivativeCount: allDerivatives.length,
    blockedCount,
    humanReviewCount,
  };
}
