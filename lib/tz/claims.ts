import { prisma } from "@/lib/db";
import { KNOWLEDGE_BASE } from "@/lib/knowledge-base";
import { CLAIM_TYPES } from "@/lib/tz/constants";

export async function seedProductTruth() {
  await prisma.product.upsert({
    where: { id: "SYSTEM_GAME" },
    update: {
      name: "Игра «Система»",
      truthJson: JSON.stringify({
        description: KNOWLEDGE_BASE.gameDescription,
        format: KNOWLEDGE_BASE.gameFormat,
        outcomes: KNOWLEDGE_BASE.outcomes,
        targetAudience: KNOWLEDGE_BASE.targetAudience,
        author: KNOWLEDGE_BASE.author,
        legal: KNOWLEDGE_BASE.legal,
      }),
    },
    create: {
      id: "SYSTEM_GAME",
      name: "Игра «Система»",
      truthJson: JSON.stringify({
        description: KNOWLEDGE_BASE.gameDescription,
        format: KNOWLEDGE_BASE.gameFormat,
        outcomes: KNOWLEDGE_BASE.outcomes,
        targetAudience: KNOWLEDGE_BASE.targetAudience,
        author: KNOWLEDGE_BASE.author,
        legal: KNOWLEDGE_BASE.legal,
      }),
    },
  });
}

export async function seedClaimsForCampaign(campaignId: string, gameId: string) {
  await prisma.claim.deleteMany({ where: { campaignId } });

  const claims = [
    {
      claimText: "Игра «Система» длится 2,5–3 часа офлайн",
      claimType: "FACT",
      sourceId: "PRODUCT_TRUTH",
      confidenceScore: 1,
      verificationStatus: "verified",
    },
    {
      claimText: "Три системы: здоровье, отношения и деньги",
      claimType: "FACT",
      sourceId: "PRODUCT_TRUTH",
      confidenceScore: 1,
      verificationStatus: "verified",
    },
    {
      claimText: "Формат 1+1: можно прийти вдвоём по одному участию",
      claimType: "FACT",
      sourceId: "PRODUCT_TRUTH",
      confidenceScore: 1,
      verificationStatus: "verified",
    },
    {
      claimText: "Метод работает с 2001 года, проведено более 2000 партий",
      claimType: "FACT",
      sourceId: "PRODUCT_TRUTH",
      confidenceScore: 0.95,
      verificationStatus: "verified",
    },
    {
      claimText: "Участник уходит с ясностью и конкретными следующими шагами",
      claimType: "AUTHOR_POSITION",
      sourceId: "DMITRY_KNOWLEDGE",
      confidenceScore: 0.9,
      verificationStatus: "verified",
    },
    ...KNOWLEDGE_BASE.hooks.slice(0, 4).map((hook) => ({
      claimText: hook,
      claimType: "HYPOTHESIS" as const,
      sourceId: "EDITORIAL_RULES",
      confidenceScore: 0.7,
      verificationStatus: "verified" as const,
    })),
  ];

  for (const c of claims) {
    if (!CLAIM_TYPES.includes(c.claimType as (typeof CLAIM_TYPES)[number])) continue;
    await prisma.claim.create({
      data: {
        campaignId,
        gameId,
        claimText: c.claimText,
        claimType: c.claimType,
        sourceId: c.sourceId,
        confidenceScore: c.confidenceScore,
        verificationStatus: c.verificationStatus,
        allowedFormats: JSON.stringify(["post", "short", "video", "carousel"]),
      },
    });
  }
}

export async function getVerifiedClaims(campaignId: string) {
  return prisma.claim.findMany({
    where: { campaignId, verificationStatus: "verified" },
    orderBy: { confidenceScore: "desc" },
  });
}
