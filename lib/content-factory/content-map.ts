import { KNOWLEDGE_BASE } from "@/lib/knowledge-base";
import type { GameAgentContext } from "@/lib/ai/agents/types";
import { pickCtaType, pickVisualStyle, verticalDuration } from "@/lib/content-factory/cta-rotation";
import { adaptToPlatform } from "@/lib/content-factory/platform-adapters";
import type { ContentUnitType, SourceUnitInput } from "@/lib/content-factory/types";
import { FACTORY_DEFAULTS } from "@/lib/content-factory/types";
import { daysUntilGame } from "@/lib/utils";

const TIME_SLOTS = ["09:00", "10:30", "12:00", "14:00", "16:00", "18:00", "20:00"];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

/** Одна смысловая единица → набор платформенных адаптаций (не один файл на все сети) */
const DERIVATIVE_MAP: Array<{
  unitType: ContentUnitType;
  platform: string;
  crossPublish?: boolean;
}> = [
  { unitType: "vertical_short", platform: "Shorts" },
  { unitType: "vertical_short", platform: "Reels", crossPublish: true },
  { unitType: "vertical_short", platform: "VK", crossPublish: true },
  { unitType: "horizontal_video", platform: "YouTube" },
  { unitType: "post_short", platform: "Telegram" },
  { unitType: "post_medium", platform: "VK" },
  { unitType: "threads_series", platform: "Threads" },
  { unitType: "carousel", platform: "Instagram" },
  { unitType: "story", platform: "Instagram" },
  { unitType: "post_long", platform: "Дзен" },
  { unitType: "email", platform: "Email" },
  { unitType: "partner_text", platform: "Telegram" },
  { unitType: "faq_response", platform: "VK" },
  { unitType: "banner", platform: "Telegram" },
];

export function buildSourceUnits(params: {
  game: GameAgentContext;
  claimIds: string[];
  campaignDays: number;
}): SourceUnitInput[] {
  const units: SourceUnitInput[] = [];
  const visualHistory: import("@/lib/content-factory/types").VisualStyle[] = [];

  for (let day = 0; day < params.campaignDays; day++) {
    const perDay = FACTORY_DEFAULTS.maxUniqueVerticalPerDay;
    for (let v = 0; v < perDay; v++) {
      const idx = day * perDay + v;
      const visualStyle = pickVisualStyle(idx, visualHistory);
      visualHistory.push(visualStyle);

      const topic = pick(KNOWLEDGE_BASE.contentTopics, idx);
      const hook = pick(KNOWLEDGE_BASE.hooks, idx).replace(
        "N",
        String(params.game.seatsTotal - params.game.seatsTaken),
      );

      units.push({
        sourceId: `SU-D${day + 1}-${String(v + 1).padStart(2, "0")}`,
        dayOffset: day,
        topic,
        coreMessage: `${topic}. ${KNOWLEDGE_BASE.outcomes[idx % KNOWLEDGE_BASE.outcomes.length]}.`,
        hook,
        claimIds: params.claimIds.slice(0, 3),
        visualStyle,
        ctaType: pickCtaType(idx),
      });
    }
  }

  return units;
}

export function expandSourceToDerivatives(params: {
  game: GameAgentContext;
  source: SourceUnitInput;
  sourceIndex: number;
  landingPath: string;
}) {
  const durationSec = verticalDuration(params.sourceIndex);
  const results = [];

  for (let i = 0; i < DERIVATIVE_MAP.length; i++) {
    const map = DERIVATIVE_MAP[i];
    const isPrimaryVertical = map.unitType === "vertical_short" && !map.crossPublish;
    const aspectRatio =
      map.unitType === "vertical_short" || map.unitType === "story"
        ? "9:16"
        : map.unitType === "horizontal_video"
          ? "16:9"
          : "1:1";

    const adapted = adaptToPlatform({
      game: params.game,
      source: params.source,
      unitType: map.unitType,
      platform: map.platform,
      landingPath: params.landingPath,
      durationSec: map.unitType === "horizontal_video" ? 360 : durationSec,
      aspectRatio,
      isCrossPublish: Boolean(map.crossPublish),
    });

    const time = TIME_SLOTS[(params.source.dayOffset * 3 + i) % TIME_SLOTS.length];

    results.push({
      sourceId: params.source.sourceId,
      unitType: map.unitType,
      platform: map.platform,
      formatType: adapted.formatType,
      topic: params.source.topic,
      hook: params.source.hook,
      cta: adapted.postText.split("\n").pop()?.includes("http") ? "См. текст" : adapted.postText.split("\n").slice(-2)[0] ?? "",
      ctaType: params.source.ctaType,
      visualStyle: params.source.visualStyle,
      aspectRatio,
      durationSec: map.unitType === "horizontal_video" ? 360 : durationSec,
      isPrimaryVertical,
      isCrossPublish: Boolean(map.crossPublish),
      dayOffset: params.source.dayOffset,
      time,
      claimIds: params.source.claimIds,
      shootBrief: adapted.shootBrief,
      script: adapted.script,
      postText: adapted.postText,
    });
  }

  return results;
}

export function getCampaignDays(game: GameAgentContext) {
  const daysLeft = daysUntilGame(game.date);
  return Math.min(Math.max(daysLeft, 3), 28);
}
