/**
 * Константы и статусы из ТЗ v2.0 (16.07.2026)
 */

export const PRODUCT_ID = "SYSTEM_GAME" as const;

export const KNOWLEDGE_LAYERS = [
  "PRODUCT_TRUTH",
  "DMITRY_KNOWLEDGE",
  "EDITORIAL_RULES",
  "LEADER_CONTEXT",
  "CAMPAIGN_DATA",
  "GLOBAL_LEARNINGS",
] as const;

export const CLAIM_TYPES = [
  "FACT",
  "AUTHOR_POSITION",
  "TESTIMONY",
  "OBSERVATION",
  "HYPOTHESIS",
] as const;

export const CONTENT_STATUSES = [
  "DRAFT",
  "RESEARCH",
  "GENERATED",
  "VERIFICATION",
  "HUMAN_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHING",
  "PUBLISHED",
  "FAILED",
  "BLOCKED",
  "ARCHIVED",
] as const;

export const LEAD_STATUSES = [
  "NEW",
  "ENGAGED",
  "DIAGNOSTIC_STARTED",
  "DIAGNOSTIC_COMPLETED",
  "QUALIFIED",
  "HOT",
  "LEADER_ASSIGNED",
  "CALL_SCHEDULED",
  "PAYMENT_LINK_SENT",
  "PAYMENT_STARTED",
  "PAID",
  "CONFIRMED",
  "ATTENDED",
  "NO_SHOW",
  "REFUND",
  "DECLINED",
  "ESCALATED",
] as const;

export const PUBLICATION_MODES = ["A", "B", "C"] as const;

export const ANALYTICS_EVENTS = [
  "PAGE_VIEW",
  "CTA_CLICK",
  "FORM_START",
  "LEAD_CREATED",
  "BOT_STARTED",
  "DIAGNOSTIC_COMPLETED",
  "QUALIFIED",
  "PAYMENT_LINK_SENT",
  "PAYMENT_STARTED",
  "PAID",
  "CONFIRMED",
  "ATTENDED",
  "NO_SHOW",
  "REVIEW_RECEIVED",
  "REFERRAL",
] as const;

export type AgentId =
  | "task_setter"
  | "research_planner"
  | "critic"
  | "scouts"
  | "knowledge_builder"
  | "verifier"
  | "content_editor"
  | "video_producer"
  | "publisher"
  | "traffic_manager"
  | "partner_agent"
  | "sales_lidorub"
  | "analyst"
  | "product_guard"
  | "orchestrator";

export const AGENTS: Record<
  AgentId,
  { name: string; description: string; phase: number }
> = {
  task_setter: {
    name: "Постановщик задачи",
    description: "Собирает контекст кампании и формализует измеримую цель",
    phase: 1,
  },
  research_planner: {
    name: "Планировщик исследования",
    description: "Формирует план данных, источников, сегментов и тестов",
    phase: 1,
  },
  critic: {
    name: "Критик",
    description: "Проверяет план исследования (до 3 итераций)",
    phase: 1,
  },
  scouts: {
    name: "Скауты",
    description: "Собирают claims, партнёров, вопросы и сигналы спроса",
    phase: 2,
  },
  knowledge_builder: {
    name: "Конструктор знаний",
    description: "Структурирует claims, связи и достоверность",
    phase: 2,
  },
  verifier: {
    name: "Верификатор",
    description: "Перепроверяет источники и разрешения на использование",
    phase: 2,
  },
  content_editor: {
    name: "Контент-редактор",
    description: "Готовит тексты, сценарии, посты и FAQ",
    phase: 3,
  },
  video_producer: {
    name: "Видеопродюсер",
    description: "Собирает сценарии для видео (аватар — этап 2)",
    phase: 3,
  },
  publisher: {
    name: "Издатель",
    description: "Адаптирует и планирует публикации по площадкам",
    phase: 4,
  },
  traffic_manager: {
    name: "Трафик-менеджер",
    description: "Гипотезы рекламы и дистрибуции",
    phase: 4,
  },
  partner_agent: {
    name: "Партнёрский агент",
    description: "Квалифицирует площадки и готовит предложения",
    phase: 4,
  },
  sales_lidorub: {
    name: "Ледоруб (AI Sales)",
    description: "Ведёт лида по стандартному пути до оплаты",
    phase: 5,
  },
  analyst: {
    name: "Аналитик",
    description: "Связывает действия с результатом, считает узкое место",
    phase: 6,
  },
  product_guard: {
    name: "Product Guard",
    description: "Блокирует сторонние продукты, ссылки и обещания",
    phase: 0,
  },
  orchestrator: {
    name: "Оркестратор",
    description: "Управляет агентами, очередями и ежедневным планом",
    phase: 0,
  },
};

export const PLATFORMS_TZ = [
  { id: "youtube", name: "YouTube", priority: 1, mode: "A/B" },
  { id: "telegram", name: "Telegram", priority: 1, mode: "A" },
  { id: "vk", name: "VK", priority: 1, mode: "A/B/C" },
  { id: "rutube", name: "RUTUBE", priority: 1, mode: "B/C" },
  { id: "dzen", name: "Дзен", priority: 1, mode: "B/C" },
  { id: "instagram", name: "Instagram", priority: 2, mode: "A/B" },
  { id: "threads", name: "Threads", priority: 2, mode: "A/B" },
  { id: "ok", name: "Одноклассники", priority: 2, mode: "B/C" },
  { id: "email", name: "Email", priority: 2, mode: "A" },
] as const;

export const PILOT_GOALS = {
  targetAttended: 60,
  campaignWeeks: 4,
  maxVerticalVideosPerDay: 5,
};
