import { logAgentAction } from "@/lib/ai/agents/base";
import type { ContentPlanItem, GameAgentContext } from "@/lib/ai/agents/types";

const ALLOWED_PLATFORMS = ["Telegram", "Shorts", "Threads", "VK", "Reels", "YouTube"];

export async function runDistributionAgent(
  game: GameAgentContext,
  items: ContentPlanItem[],
): Promise<ContentPlanItem[]> {
  const distributed = items.map((item, index) => {
    const platform = ALLOWED_PLATFORMS.includes(item.platform)
      ? item.platform
      : ALLOWED_PLATFORMS[index % ALLOWED_PLATFORMS.length];

    const timeSlots = ["09:00", "10:30", "12:00", "15:00", "18:00", "20:00"];
    const time = timeSlots.includes(item.time) ? item.time : timeSlots[index % timeSlots.length];

    return {
      ...item,
      platform,
      time,
      dayOffset: Math.max(0, item.dayOffset ?? index % 14),
    };
  });

  await logAgentAction(
    game.id,
    "distribution",
    "ai",
    `Распределено ${distributed.length} публикаций по ${ALLOWED_PLATFORMS.length} площадкам`,
    { count: distributed.length },
  );

  return distributed;
}
