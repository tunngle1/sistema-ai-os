/**
 * Контентная фабрика — типы по ТЗ §11
 */

export const CONTENT_UNIT_TYPES = [
  "vertical_short",
  "horizontal_video",
  "post_short",
  "post_medium",
  "post_long",
  "carousel",
  "story",
  "threads_series",
  "email",
  "partner_text",
  "faq_response",
  "banner",
  "interview",
  "live_recording",
] as const;

export type ContentUnitType = (typeof CONTENT_UNIT_TYPES)[number];

export const CTA_TYPES = [
  "diagnostic",
  "game_page",
  "stream",
  "lead",
  "material",
] as const;

export type CtaType = (typeof CTA_TYPES)[number];

export const VISUAL_STYLES = [
  "avatar",
  "broll",
  "real_footage",
  "cards",
  "testimonial",
] as const;

export type VisualStyle = (typeof VISUAL_STYLES)[number];

export const CTA_LABELS: Record<CtaType, string> = {
  diagnostic: "Пройти диагностику / задать вопрос",
  game_page: "Перейти на страницу игры",
  stream: "Присоединиться к эфиру",
  lead: "Оставить заявку",
  material: "Получить полезный материал",
};

export const CTA_TEXT: Record<CtaType, string> = {
  diagnostic: "Напишите свой запрос — помогу понять, подходит ли вам формат",
  game_page: "Подробности и регистрация на странице игры",
  stream: "Присоединяйтесь к эфиру — разберём формат игры",
  lead: "Оставьте заявку — забронируем место",
  material: "Заберите чек-лист: 3 системы жизни предпринимателя",
};

export const UNIT_TYPE_LABELS: Record<ContentUnitType, string> = {
  vertical_short: "Вертикальное видео 9:16",
  horizontal_video: "Горизонтальное экспертное видео",
  post_short: "Короткий пост",
  post_medium: "Пост среднего формата",
  post_long: "Длинный пост / статья",
  carousel: "Карусель",
  story: "Stories",
  threads_series: "Threads-серия",
  email: "Email-рассылка",
  partner_text: "Партнёрский текст",
  faq_response: "FAQ / ответ на возражение",
  banner: "Афиша / баннер",
  interview: "Интервью / разбор",
  live_recording: "Запись эфира",
};

export type QcCheckName =
  | "product_guard"
  | "claim_source"
  | "accuracy"
  | "voice"
  | "uniqueness"
  | "platform"
  | "reputation"
  | "cta";

export type QcCheckResult = {
  name: QcCheckName;
  passed: boolean;
  message?: string;
};

export type QcReport = {
  passed: boolean;
  checks: QcCheckResult[];
  blockedBy?: string;
};

export type SourceUnitInput = {
  sourceId: string;
  dayOffset: number;
  topic: string;
  coreMessage: string;
  hook: string;
  claimIds: string[];
  visualStyle: VisualStyle;
  ctaType: CtaType;
};

export type FactoryDerivative = {
  sourceId: string;
  unitType: ContentUnitType;
  platform: string;
  formatType: string;
  topic: string;
  hook: string;
  cta: string;
  ctaType: CtaType;
  visualStyle: VisualStyle;
  aspectRatio: string;
  durationSec: number;
  isPrimaryVertical: boolean;
  isCrossPublish: boolean;
  dayOffset: number;
  time: string;
  claimIds: string[];
  shootBrief: string;
  script: string;
  postText: string;
  qc: QcReport;
  status: string;
  blockReason?: string;
  similarityScore?: number;
  requiresHumanApproval: boolean;
};

export const FACTORY_DEFAULTS = {
  similarityThreshold: 0.72,
  humanApprovalVerticalLimit: 100,
  verticalDurationMin: 20,
  verticalDurationMax: 90,
  maxUniqueVerticalPerDay: 5,
  maxSameVisualStyleInRow: 2,
};
