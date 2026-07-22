import type { ContentUnitType, QcCheckResult } from "@/lib/content-factory/types";
import { FACTORY_DEFAULTS } from "@/lib/content-factory/types";

type PlatformRule = {
  maxChars?: number;
  minDuration?: number;
  maxDuration?: number;
  aspectRatio?: string;
};

const RULES: Record<string, Partial<Record<ContentUnitType, PlatformRule>>> = {
  Shorts: {
    vertical_short: { aspectRatio: "9:16", minDuration: 20, maxDuration: 90, maxChars: 500 },
  },
  Reels: {
    vertical_short: { aspectRatio: "9:16", minDuration: 20, maxDuration: 90, maxChars: 500 },
  },
  VK: {
    vertical_short: { aspectRatio: "9:16", minDuration: 20, maxDuration: 90 },
    carousel: { maxChars: 2000 },
    post_medium: { maxChars: 4000 },
  },
  YouTube: {
    horizontal_video: { aspectRatio: "16:9", minDuration: 180, maxDuration: 600 },
  },
  Telegram: {
    post_short: { maxChars: 900 },
  },
  Threads: {
    threads_series: { maxChars: 500 },
    post_medium: { maxChars: 500 },
  },
  Email: {
    email: { maxChars: 3000 },
  },
  "Дзен": {
    post_long: { maxChars: 15000 },
  },
  Instagram: {
    carousel: { maxChars: 2200 },
    story: { maxChars: 200 },
  },
};

export function checkPlatformRules(params: {
  platform: string;
  unitType: ContentUnitType;
  postText: string;
  aspectRatio: string;
  durationSec: number;
}): QcCheckResult {
  const rule = RULES[params.platform]?.[params.unitType] ?? RULES[params.platform]?.post_medium;

  if (!rule) {
    return { name: "platform", passed: true, message: "Базовые правила площадки" };
  }

  if (rule.aspectRatio && rule.aspectRatio !== params.aspectRatio) {
    return {
      name: "platform",
      passed: false,
      message: `Нужен формат ${rule.aspectRatio}, получен ${params.aspectRatio}`,
    };
  }

  if (rule.minDuration && params.durationSec < rule.minDuration) {
    return {
      name: "platform",
      passed: false,
      message: `Мин. длительность ${rule.minDuration} сек (сейчас ${params.durationSec})`,
    };
  }

  if (rule.maxDuration && params.durationSec > rule.maxDuration) {
    return {
      name: "platform",
      passed: false,
      message: `Макс. длительность ${rule.maxDuration} сек (сейчас ${params.durationSec})`,
    };
  }

  if (rule.maxChars && params.postText.length > rule.maxChars) {
    return {
      name: "platform",
      passed: false,
      message: `Превышена длина: ${params.postText.length}/${rule.maxChars} символов`,
    };
  }

  if (params.unitType === "vertical_short") {
    if (params.durationSec < FACTORY_DEFAULTS.verticalDurationMin) {
      return {
        name: "platform",
        passed: false,
        message: `Вертикальное видео: мин. ${FACTORY_DEFAULTS.verticalDurationMin} сек`,
      };
    }
  }

  return { name: "platform", passed: true };
}

export function checkCtaTracking(utm: string, ctaType: string): QcCheckResult {
  if (!utm.includes("utm_content") || !utm.includes(ctaType)) {
    return {
      name: "cta",
      passed: false,
      message: "CTA не отслеживается в UTM",
    };
  }
  return { name: "cta", passed: true, message: `CTA: ${ctaType}` };
}
