import { UNIT_TYPE_LABELS, type ContentUnitType } from "@/lib/content-factory/types";

export type ContentFormat = "short" | "video" | "post" | "story" | "article" | "carousel";

export const FORMAT_LABELS: Record<ContentFormat, string> = {
  short: "Short / Reels (15–60 сек)",
  video: "Длинное видео (3–10 мин)",
  post: "Текстовый пост",
  story: "Stories",
  article: "Статья / Email",
  carousel: "Карусель",
};

export { UNIT_TYPE_LABELS };

export function formatForPlatform(platform: string): ContentFormat {
  const p = platform.toLowerCase();
  if (p === "shorts" || p === "reels") return "short";
  if (p === "youtube") return "video";
  if (p === "threads") return "post";
  return "post";
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  RESEARCH: "Исследование",
  GENERATED: "Сгенерировано",
  VERIFICATION: "Верификация",
  HUMAN_REVIEW: "На проверке",
  APPROVED: "Утверждено",
  SCHEDULED: "Запланировано",
  PUBLISHING: "Публикуется",
  PUBLISHED: "Опубликовано",
  FAILED: "Ошибка",
  BLOCKED: "Заблокировано",
  ARCHIVED: "Архив",
};

export function unitTypeLabel(unitType: string) {
  return UNIT_TYPE_LABELS[unitType as ContentUnitType] ?? unitType;
}

export function buildFallbackBrief(params: {
  platform: string;
  topic: string;
  hook: string;
  cta: string;
  game: {
    city: string;
    date: Date;
    time: string;
    price: number;
    leaderName: string;
    seatsLeft: number;
  };
  landingPath: string;
}) {
  const formatType = formatForPlatform(params.platform);
  const dateStr = new Date(params.game.date).toLocaleDateString("ru-RU");

  const shootBrief =
    formatType === "short"
      ? `Снимите вертикальное видео 9:16, 20–90 сек. Safe zones для титров. ${params.game.leaderName} в кадре или B-roll.`
      : formatType === "video"
        ? `Запишите горизонтальное видео 16:9, 5–8 мин по теме «${params.topic}».`
        : `Подготовьте адаптированный текст для ${params.platform}.`;

  const script = [
    `Хук: ${params.hook}`,
    `Тема: ${params.topic}`,
    `CTA: ${params.cta}`,
  ].join("\n");

  const postText = [
    params.hook,
    "",
    params.topic,
    "",
    `🎲 ${params.game.city} · ${dateStr}`,
    params.cta,
    params.landingPath,
  ].join("\n");

  return { formatType, shootBrief, script, postText };
}
