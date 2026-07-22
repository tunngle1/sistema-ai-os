export type ContentFormat = "short" | "video" | "post" | "story" | "article";

export const FORMAT_LABELS: Record<ContentFormat, string> = {
  short: "Short / Reels (15–60 сек)",
  video: "Длинное видео (3–10 мин)",
  post: "Текстовый пост",
  story: "Stories",
  article: "Статья",
};

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
  ready: "Готово к съёмке",
  scheduled: "Запланировано",
  published: "Опубликовано",
};

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
      ? `Снимите вертикальное видео 15–45 сек. В кадре — вы (${params.game.leaderName}). Начните с хука, в середине — суть темы «${params.topic}», в конце — призыв.`
      : formatType === "video"
        ? `Запишите горизонтальное видео 3–7 мин: представьтесь, раскройте тему «${params.topic}», расскажите что такое игра «Система», в конце — дата и CTA.`
        : `Подготовьте текстовый пост для ${params.platform}: заголовок-хук, 2–3 абзаца по теме, блок с датой игры и ссылкой.`;

  const script = [
    `Хук: ${params.hook}`,
    `Тема: ${params.topic}`,
    `Раскройте: чем игра «Система» помогает получить ясность за один вечер.`,
    `Факты: ${params.game.city}, ${dateStr}, ${params.game.time}. Осталось ${params.game.seatsLeft} мест. Цена ${params.game.price.toLocaleString("ru-RU")} ₽.`,
    `Завершение: ${params.cta}.`,
  ].join("\n");

  const postText = [
    params.hook,
    "",
    params.topic,
    "",
    `🎲 Игра «Система» · ${params.game.city}`,
    `📅 ${dateStr}, ${params.game.time}`,
    `💰 ${params.game.price.toLocaleString("ru-RU")} ₽ · осталось ${params.game.seatsLeft} мест`,
    "",
    `${params.cta} 👇`,
    params.landingPath,
  ].join("\n");

  return { formatType, shootBrief, script, postText };
}
