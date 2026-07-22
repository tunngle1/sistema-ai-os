import { differenceInDays, format } from "date-fns";
import { ru } from "date-fns/locale";

const CYRILLIC_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

const CITY_CODES: Record<string, string> = {
  moskva: "MOSCOW",
  "sankt-peterburg": "SPB",
  spb: "SPB",
  kazan: "KAZAN",
  "ekaterinburg": "EKATERINBURG",
  novosibirsk: "NOVOSIBIRSK",
};

export function transliterateCity(city: string): string {
  const transliterated = city
    .toLowerCase()
    .trim()
    .split("")
    .map((char) => CYRILLIC_MAP[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return transliterated;
}

export function getCityCode(city: string): string {
  const slug = transliterateCity(city);
  if (CITY_CODES[slug]) return CITY_CODES[slug];
  return slug.replace(/-/g, "").toUpperCase().slice(0, 10) || "CITY";
}

export function generateGameId(city: string, date: Date, sequence = 1): string {
  const cityCode = getCityCode(city);
  const datePart = format(date, "yyyy-MM-dd");
  const seq = String(sequence).padStart(3, "0");
  return `${cityCode}-${datePart}-${seq}`;
}

export function generateSlug(city: string, date: Date): string {
  const citySlug = transliterateCity(city);
  const dateSlug = format(date, "dd-MM");
  return `${citySlug}-${dateSlug}`;
}

export function daysUntilGame(gameDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(gameDate);
  target.setHours(0, 0, 0, 0);
  return Math.max(0, differenceInDays(target, today));
}

export function formatGameDate(date: Date): string {
  return format(date, "d MMMM yyyy", { locale: ru });
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(price);
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type CampaignStrategy =
  | "large"
  | "intensive"
  | "max_warmup"
  | "urgent";

export function pickStrategy(daysLeft: number): {
  key: CampaignStrategy;
  name: string;
  description: string;
  contentMultiplier: number;
} {
  if (daysLeft >= 28) {
    return {
      key: "large",
      name: "Большая кампания",
      description: "Широкий охват, прогрев, контент-план на весь период",
      contentMultiplier: 1,
    };
  }
  if (daysLeft >= 14) {
    return {
      key: "intensive",
      name: "Интенсивная кампания",
      description: "Больше публикаций, акцент на ценность и отзывы",
      contentMultiplier: 0.7,
    };
  }
  if (daysLeft >= 5) {
    return {
      key: "max_warmup",
      name: "Максимальный прогрев",
      description: "Дефицит мест, партнёрские публикации, активация базы",
      contentMultiplier: 0.5,
    };
  }
  return {
    key: "urgent",
    name: "Срочная кампания",
    description: "Фокус на срочность, остаток мест, прямой CTA, напоминания",
    contentMultiplier: 0.3,
  };
}
