import { prisma } from "@/lib/db";
import { runSalesReplyAgent, runSalesWelcomeAgent } from "@/lib/ai/agents/sales-agent";
import { KNOWLEDGE_BASE } from "@/lib/knowledge-base";
import { trackEvent } from "@/lib/services/analytics";
import { checkProductGuard, logGuardViolation } from "@/lib/tz/product-guard";
import { isHotLead, isPaidStage, type LeadStageTz } from "@/lib/tz/lead-status";

function detectIntent(message: string): string {
  const lower = message.toLowerCase();

  if (/оплат|брон|мест|регистр|приду|прийти|хочу участ|запис/.test(lower)) {
    return "wants_to_come";
  }
  if (/ведущ|кто вед|сколько сто|цена|стоим|как проход|длит|вернут|оферт/.test(lower)) {
    return "interested";
  }
  if (/не знаю|впервые|что такое|расскаж|объясн|не слыш/.test(lower)) {
    return "unknown";
  }
  if (/оплатил|перевел|перевёл|чек|квитан/.test(lower)) {
    return "paid";
  }
  if (/поговор|связ|ведущ|человек|менедж|звон/.test(lower)) {
    return "handoff";
  }

  return "general";
}

function calculatePurchaseScore(stage: LeadStageTz, message: string): number {
  let score = 10;

  if (stage === "ENGAGED" || stage === "DIAGNOSTIC_COMPLETED") score = 35;
  if (stage === "QUALIFIED") score = 55;
  if (stage === "HOT" || stage === "PAYMENT_LINK_SENT") score = 75;
  if (isPaidStage(stage)) score = 100;

  const lower = message.toLowerCase();
  if (/сегодня|завтра|срочно|готов/.test(lower)) score += 10;
  if (/дорого|подума|не уверен|сомнева/.test(lower)) score -= 15;
  if (/оплат|брон/.test(lower)) score += 15;

  return Math.max(5, Math.min(100, score));
}

function buildReply(
  stage: LeadStageTz,
  intent: string,
  userMessage: string,
  game: {
    city: string;
    date: Date;
    price: number;
    seatsTotal: number;
    seatsTaken: number;
    leaderName: string;
  },
): { reply: string; nextStage: LeadStageTz; nextAction: string; handoff: boolean } {
  const seatsLeft = game.seatsTotal - game.seatsTaken;
  const dateStr = new Date(game.date).toLocaleDateString("ru-RU");
  const lower = userMessage.toLowerCase();
  const scenarios = KNOWLEDGE_BASE.salesScenarios;

  if (intent === "handoff") {
    return {
      reply:
        "Конечно! Передаю ваш запрос ведущему — он свяжется с вами лично в ближайшее время.",
      nextStage: "LEADER_ASSIGNED",
      nextAction: "Ведущий связывается лично",
      handoff: true,
    };
  }

  if (stage === "NEW" || intent === "unknown") {
    if (/впервые|не знаю|не слыш|расскаж|что такое/.test(lower)) {
      return {
        reply: scenarios.unknown.responses.first_time,
        nextStage: "DIAGNOSTIC_STARTED",
        nextAction: "Продолжить диагностику интереса",
        handoff: false,
      };
    }
    return {
      reply: scenarios.unknown.greeting,
      nextStage: "ENGAGED",
      nextAction: "Определить знакомство с продуктом",
      handoff: false,
    };
  }

  if (
    ["ENGAGED", "DIAGNOSTIC_STARTED", "DIAGNOSTIC_COMPLETED"].includes(stage) ||
    intent === "interested"
  ) {
    if (/стоим|цена|сколько/.test(lower)) {
      return {
        reply: scenarios.interested.responses.price.replace(
          "указана на странице",
          `составляет ${game.price.toLocaleString("ru-RU")} ₽`,
        ),
        nextStage: "DIAGNOSTIC_COMPLETED",
        nextAction: "Предложить бронирование",
        handoff: false,
      };
    }
    if (/ведущ|кто/.test(lower)) {
      return {
        reply: scenarios.interested.responses.leader.replace(
          "сертифицированный ведущий",
          game.leaderName,
        ),
        nextStage: "DIAGNOSTIC_COMPLETED",
        nextAction: "Предложить бронирование",
        handoff: false,
      };
    }
    if (/как проход|длит/.test(lower)) {
      return {
        reply: scenarios.interested.responses.how_it_works,
        nextStage: "QUALIFIED",
        nextAction: "Спросить о готовности участвовать",
        handoff: false,
      };
    }
    return {
      reply: scenarios.interested.greeting,
      nextStage: "QUALIFIED",
      nextAction: "Ответить на вопрос клиента",
      handoff: false,
    };
  }

  if (intent === "wants_to_come" || ["HOT", "PAYMENT_LINK_SENT", "PAYMENT_STARTED"].includes(stage)) {
    return {
      reply: scenarios.wants_to_come.payment,
      nextStage: "PAYMENT_LINK_SENT",
      nextAction: "Дождаться подтверждения оплаты",
      handoff: seatsLeft <= 3,
    };
  }

  if (intent === "paid" || isPaidStage(stage)) {
    return {
      reply: scenarios.paid.greeting,
      nextStage: "PAID",
      nextAction: "Отправить напоминание за день до игры",
      handoff: false,
    };
  }

  return {
    reply: `Игра «Система» пройдёт ${dateStr} в ${game.city}. Осталось ${seatsLeft} мест. Чем могу помочь?`,
    nextStage: stage,
    nextAction: "Уточнить запрос клиента",
    handoff: false,
  };
}

async function toGameContext(game: {
  id: string;
  title: string;
  slug: string;
  city: string;
  address: string;
  date: Date;
  time: string;
  price: number;
  seatsTotal: number;
  seatsTaken: number;
  leaderName: string;
  leaderBio: string | null;
}) {
  return {
    id: game.id,
    title: game.title,
    slug: game.slug,
    city: game.city,
    address: game.address,
    date: game.date,
    time: game.time,
    price: game.price,
    seatsTotal: game.seatsTotal,
    seatsTaken: game.seatsTaken,
    leaderName: game.leaderName,
    leaderBio: game.leaderBio,
  };
}

export async function processLeadMessage(leadId: string, userMessage: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { game: true, messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!lead) throw new Error("Лид не найден");

  const guard = checkProductGuard(userMessage);
  if (!guard.allowed) {
    await logGuardViolation(lead.gameId, userMessage, guard);
  }

  await prisma.message.create({
    data: { leadId, role: "user", content: userMessage },
  });

  const intent = detectIntent(userMessage);
  const currentStage = (lead.stage as LeadStageTz) || "NEW";
  const meta = buildReply(currentStage, intent, userMessage, lead.game);
  const gameCtx = await toGameContext({ ...lead.game, leaderBio: lead.game.leaderBio ?? null });

  const salesResult = await runSalesReplyAgent({
    game: gameCtx,
    gameId: lead.gameId,
    stage: currentStage,
    history: lead.messages,
    userMessage,
    fallback: () => meta.reply,
  });

  const reply = salesResult.reply;
  const { nextStage, nextAction, handoff } = meta;

  const purchaseScore = calculatePurchaseScore(nextStage, userMessage);
  const shouldHandoff = handoff || isHotLead(nextStage, purchaseScore);

  let objections = lead.objections ?? "";
  if (/дорого|подума|не уверен|сомнева|страш|боюсь/.test(userMessage.toLowerCase())) {
    objections = objections
      ? `${objections}; ${userMessage.slice(0, 100)}`
      : userMessage.slice(0, 100);
  }

  await prisma.message.create({
    data: { leadId, role: "assistant", content: reply },
  });

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      stage: nextStage,
      purchaseScore,
      nextAction,
      objections,
      handedToLeader: shouldHandoff || lead.handedToLeader,
      paid: isPaidStage(nextStage) || intent === "paid" || lead.paid,
      qualifiedAt:
        ["QUALIFIED", "HOT", "PAYMENT_LINK_SENT"].includes(nextStage) && !lead.qualifiedAt
          ? new Date()
          : lead.qualifiedAt,
      interest:
        nextStage === "PAYMENT_LINK_SENT"
          ? "Готов к регистрации"
          : nextStage === "QUALIFIED"
            ? "Изучает детали"
            : lead.interest,
    },
    include: { messages: { orderBy: { createdAt: "asc" } }, game: true },
  });

  if (nextStage === "QUALIFIED") {
    await trackEvent({ gameId: lead.gameId, eventType: "QUALIFIED", leadId });
  }
  if (isPaidStage(nextStage)) {
    await trackEvent({ gameId: lead.gameId, eventType: "PAID", leadId });
  }

  return { lead: updatedLead, reply, shouldHandoff };
}

export async function createLeadWithWelcome(
  gameId: string,
  data: {
    name: string;
    phone: string;
    email?: string;
    source?: string;
    platform?: string;
    utm?: string;
  },
) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new Error("Игра не найдена");

  const lead = await prisma.lead.create({
    data: {
      gameId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      source: data.source ?? "landing",
      platform: data.platform,
      utm: data.utm,
      stage: "NEW",
      nextAction: "Приветствие и диагностика интереса",
    },
  });

  await trackEvent({
    gameId,
    eventType: "LEAD_CREATED",
    leadId: lead.id,
    payload: { source: data.source, platform: data.platform },
  });

  const gameCtx = await toGameContext({ ...game, leaderBio: game.leaderBio ?? null });
  const welcomeResult = await runSalesWelcomeAgent({
    game: gameCtx,
    gameId: game.id,
    leadName: data.name,
    fallback: () => KNOWLEDGE_BASE.salesScenarios.unknown.greeting,
  });
  const welcome = welcomeResult.reply;

  await prisma.message.create({
    data: { leadId: lead.id, role: "assistant", content: welcome },
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: { stage: "ENGAGED" },
  });

  return prisma.lead.findUnique({
    where: { id: lead.id },
    include: { messages: true, game: true },
  });
}

export function buildHandoffCard(lead: {
  name: string;
  source: string;
  platform: string | null;
  stage: string;
  purchaseScore: number;
  objections: string | null;
  interest: string | null;
  nextAction: string | null;
  messages: Array<{ role: string; content: string; createdAt: Date }>;
  game: { id: string; city: string; date: Date };
}) {
  const history = lead.messages
    .map((m) => `[${m.role === "user" ? "Клиент" : "AI"}]: ${m.content}`)
    .join("\n");

  return {
    name: lead.name,
    gameId: lead.game.id,
    gameDate: lead.game.date,
    city: lead.game.city,
    source: lead.source,
    platform: lead.platform,
    stage: lead.stage,
    purchaseScore: lead.purchaseScore,
    objections: lead.objections,
    interest: lead.interest,
    nextAction: lead.nextAction,
    history,
  };
}
