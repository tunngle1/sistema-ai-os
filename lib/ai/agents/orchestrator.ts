import { prisma } from "@/lib/db";
import { runCampaignAgent } from "@/lib/ai/agents/campaign-agent";
import { logAgentAction } from "@/lib/ai/agents/base";
import { runContentFactory } from "@/lib/content-factory";
import {
  runAnalystAgent,
  runCriticAgent,
  runKnowledgeBuilderAgent,
  runPartnerAgent,
  runResearchPlannerAgent,
  runScoutsAgent,
  runTaskSetterAgent,
  runTrafficManagerAgent,
  runVerifierAgent,
  runVideoProducerAgent,
} from "@/lib/ai/agents/pipeline";
import type { GameAgentContext } from "@/lib/ai/agents/types";
import { seedClaimsForCampaign, seedProductTruth } from "@/lib/tz/claims";
import { PILOT_GOALS, PRODUCT_ID } from "@/lib/tz/constants";
import { assertSystemGameOnly, checkProductGuard, logGuardViolation } from "@/lib/tz/product-guard";

function toGameContext(game: {
  id: string;
  title: string;
  slug: string;
  date: Date;
  time: string;
  city: string;
  address: string;
  price: number;
  seatsTotal: number;
  seatsTaken: number;
  leaderName: string;
  leaderBio: string | null;
  targetAttended?: number;
  approvalMode?: string;
  budget?: number | null;
}): GameAgentContext {
  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    date: game.date,
    time: game.time,
    city: game.city,
    address: game.address,
    price: game.price,
    seatsTotal: game.seatsTotal,
    seatsTaken: game.seatsTaken,
    leaderName: game.leaderName,
    leaderBio: game.leaderBio,
    targetAttended: game.targetAttended,
    approvalMode: game.approvalMode,
    budget: game.budget,
  };
}

export async function launchGameAgents(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new Error("Игра не найдена");

  assertSystemGameOnly(game.productId);
  await seedProductTruth();

  const ctx = toGameContext(game);

  // Phase 0: Product Guard
  const guardCheck = checkProductGuard(`${game.title} ${game.leaderBio ?? ""}`);
  if (!guardCheck.allowed) {
    await logGuardViolation(gameId, game.title, guardCheck);
    throw new Error(guardCheck.reason ?? "Product Guard заблокировал кампанию");
  }
  await logAgentAction(gameId, "product_guard", "ai", "Кампания прошла Product Guard");

  // Phase 1: Task setter → Research planner → Critic (до 3 итераций)
  await runTaskSetterAgent(ctx);
  let researchPlan = (await runResearchPlannerAgent(ctx)).data;
  for (let i = 1; i <= 3; i++) {
    const critique = await runCriticAgent(ctx, researchPlan, i);
    if (critique.approved) break;
    researchPlan = (await runResearchPlannerAgent(ctx)).data;
  }

  // Phase 2: Scouts → Knowledge builder → Verifier
  await runScoutsAgent(ctx);

  // Phase 3–4: Campaign + Content + Distribution (контент-фабрика)
  const campaignData = await runCampaignAgent(ctx);
  campaignData.goalSeats = game.targetAttended ?? PILOT_GOALS.targetAttended;

  const campaign = await prisma.campaign.upsert({
    where: { gameId },
    update: {
      strategy: campaignData.strategy,
      daysLeft: campaignData.daysLeft,
      goalSeats: campaignData.goalSeats,
      accents: JSON.stringify(campaignData.accents),
      metrics: JSON.stringify(campaignData.metrics),
      productId: PRODUCT_ID,
      approvalMode: game.approvalMode,
      budget: game.budget,
      researchPlan: JSON.stringify(researchPlan),
    },
    create: {
      gameId,
      strategy: campaignData.strategy,
      daysLeft: campaignData.daysLeft,
      goalSeats: campaignData.goalSeats,
      accents: JSON.stringify(campaignData.accents),
      metrics: JSON.stringify(campaignData.metrics),
      productId: PRODUCT_ID,
      approvalMode: game.approvalMode,
      budget: game.budget,
      researchPlan: JSON.stringify(researchPlan),
    },
  });

  await seedClaimsForCampaign(campaign.id, gameId);
  const claims = await prisma.claim.findMany({ where: { campaignId: campaign.id } });
  await runKnowledgeBuilderAgent(ctx, claims.length);
  await runVerifierAgent(ctx, claims.filter((c) => c.verificationStatus === "verified").length);

  const verifiedClaimIds = claims
    .filter((c) => c.verificationStatus === "verified")
    .map((c) => c.id);

  const factoryResult = await runContentFactory({
    game: ctx,
    gameId,
    claimIds: verifiedClaimIds,
    claims,
    approvalMode: game.approvalMode,
    verticalPublishedCount: game.verticalPublishedCount,
  });

  await logAgentAction(
    gameId,
    "publisher",
    "ai",
    `Content map: ${factoryResult.sourceUnitCount} source → ${factoryResult.derivativeCount} адаптаций`,
  );

  await runVideoProducerAgent(ctx, factoryResult.derivativeCount);

  const trafficPlan = await runTrafficManagerAgent(ctx);
  await runPartnerAgent(ctx);

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { trafficPlan: JSON.stringify(trafficPlan) },
  });

  const contentReady = await prisma.contentItem.count({
    where: { gameId, status: { not: "BLOCKED" } },
  });

  const report = await runAnalystAgent(ctx, {
    leads: 0,
    qualified: 0,
    paid: 0,
    contentReady,
  });

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { dailyReport: JSON.stringify(report) },
  });

  await logAgentAction(gameId, "orchestrator", "ai", "Пайплайн кампании завершён", {
    contentCount: factoryResult.derivativeCount,
    sourceUnits: factoryResult.sourceUnitCount,
    blocked: factoryResult.blockedCount,
    claims: claims.length,
  });

  return {
    campaign: campaignData,
    contentCount: factoryResult.derivativeCount,
    report,
  };
}

export async function getAgentRuns(gameId: string) {
  return prisma.agentRun.findMany({
    where: { gameId },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveContentItem(itemId: string) {
  const item = await prisma.contentItem.findUnique({
    where: { id: itemId },
    include: { game: true },
  });
  if (!item) throw new Error("Контент не найден");
  if (item.status === "BLOCKED") throw new Error("Контент заблокирован QC");

  const verticalCount = item.game.verticalPublishedCount;
  const needsHuman =
    item.requiresHumanApproval ||
    (item.isPrimaryVertical && verticalCount < 100) ||
    item.approvalMode !== "A";

  const nextStatus =
    item.approvalMode === "A" && !needsHuman ? "SCHEDULED" : "APPROVED";

  const updated = await prisma.contentItem.update({
    where: { id: itemId },
    data: { status: nextStatus, approvedAt: new Date() },
  });

  if (item.isPrimaryVertical) {
    await prisma.game.update({
      where: { id: item.gameId },
      data: { verticalPublishedCount: { increment: 1 } },
    });
  }

  return updated;
}

export async function rejectContentItem(itemId: string, reason?: string) {
  return prisma.contentItem.update({
    where: { id: itemId },
    data: { status: "DRAFT", blockReason: reason ?? "Отклонено ведущим" },
  });
}

export async function markContentPublished(itemId: string) {
  const item = await prisma.contentItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Контент не найден");
  if (item.status === "BLOCKED") throw new Error("Нельзя публиковать заблокированный контент");
  if (!["APPROVED", "SCHEDULED"].includes(item.status)) {
    throw new Error("Сначала утвердите контент");
  }

  return prisma.contentItem.update({
    where: { id: itemId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
}
