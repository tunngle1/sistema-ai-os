import { NextResponse } from "next/server";
import { getAnalytics, getGameDashboard } from "@/lib/services/game";
import { publishScheduledContent } from "@/lib/services/content";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await publishScheduledContent(id);
    const game = await getGameDashboard(id);
    if (!game) {
      return NextResponse.json({ error: "Игра не найдена" }, { status: 404 });
    }
    const analytics = await getAnalytics(id);
    return NextResponse.json({ game, analytics });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
