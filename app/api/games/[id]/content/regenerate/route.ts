import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runContentFactory } from "@/lib/content-factory";
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
      targetAttended: game.targetAttended,
      approvalMode: game.approvalMode,
      budget: game.budget,
    };

    const claims = await prisma.claim.findMany({
      where: { campaignId: game.campaign.id },
    });

    const result = await runContentFactory({
      game: ctx,
      gameId: id,
      claimIds: claims.filter((c) => c.verificationStatus === "verified").map((c) => c.id),
      claims,
      approvalMode: game.approvalMode,
      verticalPublishedCount: game.verticalPublishedCount,
    });

    const items = await prisma.contentItem.findMany({
      where: { gameId: id },
      orderBy: { scheduledAt: "asc" },
      include: { sourceUnit: true },
    });

    return NextResponse.json({ ...result, count: items.length, items });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка генерации" },
      { status: 500 },
    );
  }
}
