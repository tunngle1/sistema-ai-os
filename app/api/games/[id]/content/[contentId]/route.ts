import { NextResponse } from "next/server";
import {
  approveContentItem,
  markContentPublished,
  rejectContentItem,
} from "@/lib/ai/agents/orchestrator";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; contentId: string }> },
) {
  try {
    const { contentId } = await params;
    const body = await request.json();

    if (body.action === "approve") {
      const item = await approveContentItem(contentId);
      return NextResponse.json(item);
    }
    if (body.action === "reject") {
      const item = await rejectContentItem(contentId, body.reason);
      return NextResponse.json(item);
    }
    if (body.action === "publish") {
      const item = await markContentPublished(contentId);
      return NextResponse.json(item);
    }

    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка" },
      { status: 500 },
    );
  }
}
