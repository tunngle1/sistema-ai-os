import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAndLaunchGame, ensureDefaultLeader } from "@/lib/services/game";

export async function GET() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      campaign: true,
      _count: { select: { leads: true, contentItems: true } },
    },
  });

  return NextResponse.json(games);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const leader = await ensureDefaultLeader();

    const game = await createAndLaunchGame({
      leaderId: leader.id,
      title: body.title,
      date: body.date,
      time: body.time,
      city: body.city,
      address: body.address,
      price: Number(body.price),
      seatsTotal: Number(body.seatsTotal),
      leaderName: body.leaderName || leader.name,
      leaderPhoto: body.leaderPhoto,
      leaderBio: body.leaderBio || leader.description || undefined,
      telegram: body.telegram || leader.telegram || undefined,
      vk: body.vk || leader.vk || undefined,
      youtube: body.youtube || leader.youtube || undefined,
      instagram: body.instagram || leader.instagram || undefined,
      targetAttended: Number(body.targetAttended) || 60,
      approvalMode: body.approvalMode ?? "C",
      budget: body.budget ? Number(body.budget) : undefined,
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка создания игры" },
      { status: 500 },
    );
  }
}
