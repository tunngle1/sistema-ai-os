import { prisma } from "@/lib/db";
import { runCampaignAgent } from "@/lib/ai/agents/campaign-agent";
import { runContentAgent } from "@/lib/ai/agents/content-agent";
import { runDistributionAgent } from "@/lib/ai/agents/distribution-agent";
import { logAgentAction } from "@/lib/ai/agents/base";
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

function initialContentStatus(approvalMode: string) {
  if (approvalMode === "A") return "SCHEDULED";
  if (approvalMode === "B") return "HUMAN_REVIEW";
  return "HUMAN_REVIEW";
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

  const contentPlan = await runContentAgent(ctx, campaignData);
  await logAgentAction(gameId, "content_editor", "ai", `Сгенерировано ${contentPlan.items.length} единиц контента`);

  const distributed = await runDistributionAgent(ctx, contentPlan.items);
  await logAgentAction(gameId, "publisher", "ai", "Календарь публикаций распределён по площадкам");

  await runVideoProducerAgent(ctx, distributed.length);

  const trafficPlan = await runTrafficManagerAgent(ctx);
  await runPartnerAgent(ctx);

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { trafficPlan: JSON.stringify(trafficPlan) },
  });

  await prisma.contentItem.deleteMany({ where: { gameId } });

  const landingUrl = `/l/${game.slug}`;
  const status = initialContentStatus(game.approvalMode);
  const verifiedClaimIds = claims
    .filter((c) => c.verificationStatus === "verified")
    .slice(0, 3)
    .map((c) => c.id);

  const dbItems = distributed.map((item, index) => {
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + item.dayOffset);
    const [hours, minutes] = item.time.split(":");
    scheduledAt.setHours(Number(hours), Number(minutes), 0, 0);

    const fullText = `${item.topic} ${item.hook} ${item.postText}`;
    const itemGuard = checkProductGuard(fullText);
    const itemStatus = itemGuard.allowed ? status : "BLOCKED";

    return {
      gameId,
      contentId: `${gameId}-C${String(index + 1).padStart(3, "0")}`,
      platform: item.platform,
      formatType: item.formatType,
      topic: item.topic,
      hook: item.hook,
      cta: item.cta,
      shootBrief: item.shootBrief,
      script: item.script,
      postText: item.postText,
      landingUrl,
      utm: `utm_source=${item.platform.toLowerCase()}&utm_medium=social&utm_campaign=${game.id}&utm_content=${index + 1}`,
      claimIds: JSON.stringify(verifiedClaimIds),
      approvalMode: game.approvalMode,
      scheduledAt,
      status: itemStatus,
      blockReason: itemGuard.allowed ? null : itemGuard.reason,
    };
  });

  await prisma.contentItem.createMany({ data: dbItems });

  const report = await runAnalystAgent(ctx, {
    leads: 0,
    qualified: 0,
    paid: 0,
    contentReady: dbItems.filter((i) => i.status !== "BLOCKED").length,
  });

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { dailyReport: JSON.stringify(report) },
  });

  await logAgentAction(gameId, "orchestrator", "ai", "Пайплайн кампании завершён", {
    contentCount: dbItems.length,
    claims: claims.length,
  });

  return {
    campaign: campaignData,
    contentCount: dbItems.length,
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
  const item = await prisma.contentItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Контент не найден");
  if (item.status === "BLOCKED") throw new Error("Контент заблокирован Product Guard");

  const nextStatus = item.approvalMode === "A" ? "SCHEDULED" : "APPROVED";
  return prisma.contentItem.update({
    where: { id: itemId },
    data: { status: nextStatus, approvedAt: new Date() },
  });
}

export async function rejectContentItem(itemId: string, reason?: string) {
  return prisma.contentItem.update({
    where: { id: itemId },
    data: { status: "DRAFT", blockReason: reason ?? "Отклонено ведущим" },
  });
}

export async function markContentPublished(itemId: string) {
  return prisma.contentItem.update({
    where: { id: itemId },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
}
