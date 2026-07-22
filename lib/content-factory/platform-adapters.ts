import { KNOWLEDGE_BASE } from "@/lib/knowledge-base";
import type { GameAgentContext } from "@/lib/ai/agents/types";
import {
  CTA_TEXT,
  type ContentUnitType,
  type CtaType,
  type SourceUnitInput,
  type VisualStyle,
} from "@/lib/content-factory/types";
import { verticalDuration } from "@/lib/content-factory/cta-rotation";

const VISUAL_BRIEF: Record<VisualStyle, string> = {
  avatar: "Ведущий в кадре, говорит в камеру",
  broll: "B-roll: город, офис, руки с блокнотом, атмосфера игры",
  real_footage: "Реальные кадры с игры / отзывы участников (с разрешения)",
  cards: "Текстовые карточки на экране + закадровый голос",
  testimonial: "Короткий отзыв участника или цитата на экране",
};

type AdaptParams = {
  game: GameAgentContext;
  source: SourceUnitInput;
  unitType: ContentUnitType;
  platform: string;
  landingPath: string;
  durationSec: number;
  aspectRatio: string;
  isCrossPublish: boolean;
};

function gameFacts(game: GameAgentContext) {
  const dateStr = new Date(game.date).toLocaleDateString("ru-RU");
  const seatsLeft = game.seatsTotal - game.seatsTaken;
  return { dateStr, seatsLeft };
}

export function adaptToPlatform(params: AdaptParams) {
  const { game, source, unitType, platform, landingPath, durationSec, aspectRatio, isCrossPublish } =
    params;
  const { dateStr, seatsLeft } = gameFacts(game);
  const ctaText = CTA_TEXT[source.ctaType];
  const visual = VISUAL_BRIEF[source.visualStyle];

  const baseScript = [
    `Хук: ${source.hook}`,
    `Смысл: ${source.coreMessage}`,
    `Формат: ${visual}`,
    `Факты: ${game.city}, ${dateStr}, ${game.time}. ${game.price.toLocaleString("ru-RU")} ₽.`,
    `CTA (${source.ctaType}): ${ctaText}`,
  ].join("\n");

  if (unitType === "vertical_short") {
    const crossNote = isCrossPublish
      ? `\n[Кросс-публикация с ${source.sourceId} — адаптация под ${platform}, не новый смысл]`
      : "";
    return {
      shootBrief: `Вертикальное видео 9:16, ${durationSec} сек. ${visual}. Safe zones: титры не в нижних 15% и верхних 10%. Без watermark.${crossNote}`,
      script: baseScript,
      postText: [
        source.hook,
        "",
        source.coreMessage.slice(0, 200),
        "",
        `🎲 ${game.city} · ${dateStr}`,
        ctaText,
        landingPath,
      ].join("\n"),
      formatType: "short",
    };
  }

  if (unitType === "horizontal_video") {
    return {
      shootBrief: `Горизонтальное видео 16:9, 5–8 мин. ${visual}. Структура: хук → проблема → 3 системы → приглашение.`,
      script: `${baseScript}\n\nРаскрой тему «${source.topic}» как экспертный разбор.`,
      postText: [
        `📹 ${source.topic}`,
        "",
        source.coreMessage,
        "",
        `Игра «Система» · ${game.city} · ${dateStr}`,
        ctaText,
        landingPath,
      ].join("\n"),
      formatType: "video",
    };
  }

  if (unitType === "carousel") {
    return {
      shootBrief: `Карусель 5–7 слайдов: 1) хук 2) проблема 3) 3 системы 4) результат 5) CTA. ${visual}.`,
      script: baseScript,
      postText: [
        `📌 ${source.hook}`,
        "",
        "Слайд 1: " + source.topic,
        "Слайд 2: Здоровье · Отношения · Деньги",
        "Слайд 3: " + source.coreMessage.slice(0, 120),
        "Слайд 4: " + KNOWLEDGE_BASE.outcomes[0],
        "Слайд 5: " + ctaText,
        landingPath,
      ].join("\n"),
      formatType: "carousel",
    };
  }

  if (unitType === "story") {
    return {
      shootBrief: `Stories 9:16, 3–5 кадров по 5 сек. ${visual}. Стикер-ссылка на лендинг.`,
      script: baseScript,
      postText: `${source.hook}\n${ctaText}\n${landingPath}`,
      formatType: "story",
    };
  }

  if (unitType === "threads_series") {
    return {
      shootBrief: `Threads-серия из 3 постов: тезис → инсайт → CTA. Без копипаста с других площадок.`,
      script: baseScript,
      postText: [
        `1/3 ${source.hook}`,
        `2/3 ${source.coreMessage.slice(0, 180)}`,
        `3/3 ${ctaText} → ${landingPath}`,
      ].join("\n\n"),
      formatType: "post",
    };
  }

  if (unitType === "email") {
    return {
      shootBrief: `Email: тема письма + 3 абзаца + CTA-кнопка. Персонализация: {имя}.`,
      script: baseScript,
      postText: [
        `Тема: ${source.topic}`,
        "",
        `Здравствуйте!`,
        "",
        source.coreMessage,
        "",
        ctaText,
        landingPath,
      ].join("\n"),
      formatType: "article",
    };
  }

  if (unitType === "partner_text") {
    return {
      shootBrief: `Текст для партнёра: описание формата + дата + условия коллаборации.`,
      script: baseScript,
      postText: [
        `Партнёрское предложение: игра «Система»`,
        `${game.city}, ${dateStr}. ${source.topic}.`,
        ctaText,
      ].join("\n"),
      formatType: "post",
    };
  }

  if (unitType === "faq_response") {
    const faq = KNOWLEDGE_BASE.faq[params.source.dayOffset % KNOWLEDGE_BASE.faq.length];
    return {
      shootBrief: `FAQ-пост: вопрос «${faq.q}» — ответ без выдуманных фактов.`,
      script: `В: ${faq.q}\nО: ${faq.a}`,
      postText: [`❓ ${faq.q}`, "", faq.a, "", ctaText, landingPath].join("\n"),
      formatType: "post",
    };
  }

  if (unitType === "banner") {
    return {
      shootBrief: `Афиша: заголовок, дата, город, цена, QR/ссылка. Формат для лендинга и соцсетей.`,
      script: baseScript,
      postText: [
        `🎲 Игра «Система»`,
        source.hook,
        `${game.city} · ${dateStr} · ${game.time}`,
        `${game.price.toLocaleString("ru-RU")} ₽ · ${seatsLeft} мест`,
        landingPath,
      ].join("\n"),
      formatType: "post",
    };
  }

  if (unitType === "post_long") {
    return {
      shootBrief: `Статья 1500–2500 знаков для ${platform}: экспертный разбор темы.`,
      script: baseScript,
      postText: [
        source.hook,
        "",
        source.coreMessage,
        "",
        KNOWLEDGE_BASE.gameDescription.slice(0, 400),
        "",
        ctaText,
        landingPath,
      ].join("\n"),
      formatType: "article",
    };
  }

  const isShort = unitType === "post_short";
  return {
    shootBrief: isShort
      ? `Короткий пост для ${platform}: хук + 2 абзаца + CTA.`
      : `Пост среднего формата для ${platform}: хук + раскрытие + факты игры.`,
    script: baseScript,
    postText: [
      source.hook,
      "",
      source.coreMessage.slice(0, isShort ? 200 : 400),
      "",
      `📅 ${dateStr}, ${game.city}`,
      ctaText,
      landingPath,
    ].join("\n"),
    formatType: "post",
  };
}
