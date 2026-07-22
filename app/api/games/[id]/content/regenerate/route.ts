import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runContentAgent } from "@/lib/ai/agents/content-agent";
import { runDistributionAgent } from "@/lib/ai/agents/distribution-agent";
import type { GameAgentContext } from "@/lib/ai/agents/types";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const game = await prisma.game.findUnique({
      where: { id },
      include: { campaign: true },
    });

    if (!game || !game.campaign) {
      return NextResponse.json({ error: "Игра или кампания не найдена" }, { status: 404 });
    }

    const ctx: GameAgentContext = {
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
    };

    const campaign = {
      strategy: game.campaign.strategy,
      daysLeft: game.campaign.daysLeft,
      goalSeats: game.campaign.goalSeats,
      accents: JSON.parse(game.campaign.accents) as string[],
      metrics: JSON.parse(game.campaign.metrics) as string[],
    };

    const contentPlan = await runContentAgent(ctx, campaign);
    const distributed = await runDistributionAgent(ctx, contentPlan.items);

    await prisma.contentItem.deleteMany({ where: { gameId: id } });

    const landingUrl = `/l/${game.slug}`;
    await prisma.contentItem.createMany({
      data: distributed.map((item, index) => {
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + item.dayOffset);
        const [hours, minutes] = item.time.split(":");
        scheduledAt.setHours(Number(hours), Number(minutes), 0, 0);

        return {
          gameId: id,
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
          scheduledAt,
          status: "HUMAN_REVIEW",
          approvalMode: game.approvalMode,
          contentId: `${id}-C${String(index + 1).padStart(3, "0")}`,
        };
      }),
    });

    const items = await prisma.contentItem.findMany({
      where: { gameId: id },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({ count: items.length, items });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка генерации" },
      { status: 500 },
    );
  }
}
