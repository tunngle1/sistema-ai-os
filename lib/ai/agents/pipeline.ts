import { logAgentAction, runAgentJson } from "@/lib/ai/agents/base";
import type {
  AnalystReport,
  GameAgentContext,
  ResearchPlan,
  TrafficPlan,
} from "@/lib/ai/agents/types";
import { KNOWLEDGE_BASE } from "@/lib/knowledge-base";
import { PILOT_GOALS } from "@/lib/tz/constants";

export async function runTaskSetterAgent(ctx: GameAgentContext) {
  const goalSeats = ctx.targetAttended ?? PILOT_GOALS.targetAttended;
  const data = {
    goal: `Набрать ${goalSeats} участников на игру «Система» в ${ctx.city}`,
    deadline: ctx.date.toISOString(),
    constraints: [
      "Только продукт SYSTEM_GAME",
      `Режим публикации: ${ctx.approvalMode ?? "C"}`,
      "Без сторонних продуктов и обещаний",
    ],
    kpis: ["LEAD_CREATED", "QUALIFIED", "PAID", "ATTENDED"],
  };

  await logAgentAction(ctx.id, "task_setter", "fallback", "Задача кампании формализована", data);
  return { data, source: "fallback" as const };
}

export async function runResearchPlannerAgent(ctx: GameAgentContext) {
  const fallback = (): ResearchPlan => ({
    segments: KNOWLEDGE_BASE.targetAudience.slice(0, 4),
    sources: ["PRODUCT_TRUTH", "DMITRY_KNOWLEDGE", "shkarovsystem.ru", "соцсети ведущего"],
    hypotheses: KNOWLEDGE_BASE.hooks.slice(0, 3),
    tests: [
      "A/B хуков в коротких видео",
      "Посты с FAQ vs истории участников",
      "CTA «записаться» vs «узнать формат 1+1»",
    ],
  });

  const result = await runAgentJson<ResearchPlan>({
    agent: "research_planner",
    gameId: ctx.id,
    systemPrompt:
      "Ты планировщик исследования для игры «Система». Верни JSON: segments[], sources[], hypotheses[], tests[].",
    userPrompt: `Кампания: ${ctx.city}, ${ctx.date.toLocaleDateString("ru-RU")}, цель ${ctx.targetAttended ?? 60} участников.`,
    fallback,
    validate: (d) => Array.isArray(d.segments) && d.segments.length > 0,
  });

  return result;
}

export async function runCriticAgent(
  ctx: GameAgentContext,
  plan: ResearchPlan,
  iteration: number,
) {
  const issues =
    plan.tests.length < 2
      ? ["Мало тестовых гипотез"]
      : plan.segments.length < 2
        ? ["Мало сегментов аудитории"]
        : [];

  const approved = issues.length === 0 || iteration >= 3;
  await logAgentAction(
    ctx.id,
    "critic",
    "fallback",
    approved ? "План исследования одобрен" : `Итерация ${iteration}: ${issues.join("; ")}`,
    { approved, issues, iteration },
  );

  return { approved, issues };
}

export async function runScoutsAgent(ctx: GameAgentContext) {
  const signals = [
    ...KNOWLEDGE_BASE.hooks.map((h) => ({ type: "hook", text: h })),
    ...KNOWLEDGE_BASE.faq.slice(0, 3).map((f) => ({ type: "question", text: f.q })),
  ];

  await logAgentAction(ctx.id, "scouts", "fallback", `Собрано ${signals.length} сигналов спроса`, signals);
  return signals;
}

export async function runKnowledgeBuilderAgent(ctx: GameAgentContext, claimCount: number) {
  await logAgentAction(
    ctx.id,
    "knowledge_builder",
    "fallback",
    `Структурировано ${claimCount} claims из PRODUCT_TRUTH и EDITORIAL_RULES`,
  );
}

export async function runVerifierAgent(ctx: GameAgentContext, verifiedCount: number) {
  await logAgentAction(
    ctx.id,
    "verifier",
    "fallback",
    `Верифицировано ${verifiedCount} claims для использования в контенте`,
  );
}

export async function runTrafficManagerAgent(ctx: GameAgentContext): Promise<TrafficPlan> {
  const dailyBudget = ctx.budget ? Math.round(ctx.budget / 28) : 0;
  const plan: TrafficPlan = {
    dailyBudget,
    channels: [
      { platform: "VK", budgetShare: 0.35, hypothesis: "Таргет на предпринимателей 30–45" },
      { platform: "Telegram", budgetShare: 0.25, hypothesis: "Посевы в бизнес-каналах" },
      { platform: "YouTube", budgetShare: 0.2, hypothesis: "Shorts с хуками из FAQ" },
      { platform: "Дзен", budgetShare: 0.2, hypothesis: "Статьи «системное мышление»" },
    ],
  };

  await logAgentAction(ctx.id, "traffic_manager", "fallback", "План трафика сформирован", plan);
  return plan;
}

export async function runPartnerAgent(ctx: GameAgentContext) {
  const partners = [
    { name: "Бизнес-клубы Москвы", status: "candidate", fit: "high" },
    { name: "Подкасты про предпринимательство", status: "candidate", fit: "medium" },
  ];

  await logAgentAction(ctx.id, "partner_agent", "fallback", "Кандидаты партнёров квалифицированы", partners);
  return partners;
}

export async function runAnalystAgent(
  ctx: GameAgentContext,
  stats: { leads: number; qualified: number; paid: number; contentReady: number },
): Promise<AnalystReport> {
  const funnel = {
    LEAD_CREATED: stats.leads,
    QUALIFIED: stats.qualified,
    PAID: stats.paid,
    CONTENT_READY: stats.contentReady,
  };

  let bottleneck = "Охват и контент";
  if (stats.leads > 0 && stats.qualified / stats.leads < 0.3) bottleneck = "Квалификация лидов";
  if (stats.qualified > 0 && stats.paid / stats.qualified < 0.2) bottleneck = "Конверсия в оплату";

  const report: AnalystReport = {
    bottleneck,
    recommendations: [
      "Усилить вертикальные видео с хуками из PRODUCT_TRUTH",
      "Проверить карточки горячих лидов в CRM",
      stats.contentReady < 5 ? "Доутвердить контент-план на неделю" : "Держать ритм 3–5 видео/день",
    ],
    funnel,
  };

  await logAgentAction(ctx.id, "analyst", "fallback", `Узкое место: ${bottleneck}`, report);
  return report;
}

export async function runVideoProducerAgent(ctx: GameAgentContext, itemCount: number) {
  await logAgentAction(
    ctx.id,
    "video_producer",
    "fallback",
    `Подготовлено ${itemCount} сценариев для съёмки (аватар — этап 2 ТЗ)`,
  );
}
