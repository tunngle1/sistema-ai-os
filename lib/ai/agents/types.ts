import { AGENTS, type AgentId } from "@/lib/tz/constants";

export type AgentName = AgentId | "campaign" | "content" | "distribution" | "sales";

export type AgentSource = "ai" | "fallback" | "error";

export type AgentRunResult<T> = {
  data: T;
  source: AgentSource;
  summary?: string;
};

export type GameAgentContext = {
  id: string;
  title: string;
  slug: string;
  date: Date;
  time: string;
  city: string;
  address: string;
  price: number;
  seatsTotal: number;
  seatsTaken: number;
  leaderName: string;
  leaderBio?: string | null;
  targetAttended?: number;
  approvalMode?: string;
  budget?: number | null;
};

export type CampaignAgentOutput = {
  strategy: string;
  accents: string[];
  metrics: string[];
  daysLeft: number;
  goalSeats: number;
};

export type ContentPlanItem = {
  dayOffset: number;
  time: string;
  platform: string;
  formatType: string;
  topic: string;
  hook: string;
  cta: string;
  shootBrief: string;
  script: string;
  postText: string;
  claimIds?: string[];
};

export type ContentAgentOutput = {
  items: ContentPlanItem[];
};

export type ResearchPlan = {
  segments: string[];
  sources: string[];
  hypotheses: string[];
  tests: string[];
};

export type TrafficPlan = {
  channels: Array<{ platform: string; budgetShare: number; hypothesis: string }>;
  dailyBudget: number;
};

export type AnalystReport = {
  bottleneck: string;
  recommendations: string[];
  funnel: Record<string, number>;
};

export const AGENT_LABELS: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(AGENTS).map(([id, a]) => [id, a.name]),
  ),
  campaign: "Агент кампании",
  content: "Агент контента",
  distribution: "Агент дистрибуции",
  sales: "Ледоруб (AI Sales)",
};

export const AGENT_DESCRIPTIONS: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(AGENTS).map(([id, a]) => [id, a.description]),
  ),
  campaign: "Выбирает стратегию продвижения и ключевые акценты",
  content: "Составляет контент-план: что снять, сценарий, текст поста",
  distribution: "Распределяет публикации по площадкам и времени",
  sales: "Квалифицирует лидов и ведёт диалог до оплаты",
};
