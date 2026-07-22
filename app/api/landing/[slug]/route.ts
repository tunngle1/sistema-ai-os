import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLandingData } from "@/lib/services/campaign";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const game = await prisma.game.findUnique({ where: { slug } });
  if (!game) {
    return NextResponse.json({ error: "Страница не найдена" }, { status: 404 });
  }

  return NextResponse.json({
    game,
    landing: getLandingData(game),
  });
}
