import { prisma } from "@/lib/db";
import { launchGameAgents } from "@/lib/ai/agents/orchestrator";
import { getFunnelAnalytics } from "@/lib/services/analytics";
import { generateGameId, generateSlug } from "@/lib/utils";
import { PRODUCT_ID } from "@/lib/tz/constants";

export type CreateGameInput = {
  leaderId: string;
  title?: string;
  date: string;
  time: string;
  city: string;
  address: string;
  price: number;
  seatsTotal: number;
  leaderName: string;
  leaderPhoto?: string;
  leaderBio?: string;
  telegram?: string;
  vk?: string;
  youtube?: string;
  instagram?: string;
  approvalMode?: string;
  budget?: number;
  targetAttended?: number;
};

export async function createAndLaunchGame(input: CreateGameInput) {
  const gameDate = new Date(input.date);
  const slug = generateSlug(input.city, gameDate);

  const dayStart = new Date(gameDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(gameDate);
  dayEnd.setHours(23, 59, 59, 999);

  const existingCount = await prisma.game.count({
    where: {
      city: input.city,
      date: { gte: dayStart, lte: dayEnd },
    },
  });

  const gameId = generateGameId(input.city, gameDate, existingCount + 1);

  const game = await prisma.game.create({
    data: {
      id: gameId,
      slug: `${slug}-${existingCount + 1}`,
      title: input.title ?? "Игра «Система»",
      date: gameDate,
      time: input.time,
      city: input.city,
      address: input.address,
      price: input.price,
      seatsTotal: input.seatsTotal,
      leaderName: input.leaderName,
      leaderPhoto: input.leaderPhoto,
      leaderBio: input.leaderBio,
      telegram: input.telegram,
      vk: input.vk,
      youtube: input.youtube,
      instagram: input.instagram,
      leaderId: input.leaderId,
      productId: PRODUCT_ID,
      approvalMode: input.approvalMode ?? "C",
      budget: input.budget,
      targetAttended: input.targetAttended ?? 60,
      status: "active",
      launchedAt: new Date(),
    },
  });

  await launchGameAgents(game.id);
  return prisma.game.findUnique({
    where: { id: game.id },
    include: {
      campaign: true,
      contentItems: { orderBy: { scheduledAt: "asc" }, take: 20 },
      leads: { include: { messages: true } },
    },
  });
}

export async function getGameDashboard(gameId: string) {
  return prisma.game.findUnique({
    where: { id: gameId },
    include: {
      campaign: true,
      contentItems: { orderBy: { scheduledAt: "asc" } },
      leads: {
        include: { messages: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "desc" },
      },
      leader: true,
      agentRuns: { orderBy: { createdAt: "desc" }, take: 50 },
      claims: { orderBy: { confidenceScore: "desc" }, take: 10 },
    },
  });
}

export async function getAnalytics(gameId: string) {
  return getFunnelAnalytics(gameId);
}

export async function ensureDefaultLeader() {
  return prisma.leader.upsert({
    where: { email: "leader@sistema.game" },
    update: {},
    create: {
      name: "Дмитрий Шкаров",
      email: "leader@sistema.game",
      role: "leader",
      description:
        "Серийный предприниматель, автор игры «Система». 20 лет в бизнесе, более 2000 проведённых партий.",
      telegram: "https://t.me/shkarovbiz",
      vk: "https://vk.com/sistema_leader",
    },
  });
}
