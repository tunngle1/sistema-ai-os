import { prisma } from "@/lib/db";
import { PLATFORMS } from "@/lib/knowledge-base";

export async function publishScheduledContent(gameId: string) {
  const now = new Date();
  const due = await prisma.contentItem.findMany({
    where: {
      gameId,
      status: "SCHEDULED",
      approvalMode: "A",
      scheduledAt: { lte: now },
    },
    take: 5,
  });

  for (const item of due) {
    await prisma.contentItem.update({
      where: { id: item.id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
  }

  return due.length;
}

export { PLATFORMS };
