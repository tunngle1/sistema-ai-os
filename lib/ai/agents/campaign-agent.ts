import { KNOWLEDGE_BASE, PLATFORMS } from "@/lib/knowledge-base";
import { runAgentJson } from "@/lib/ai/agents/base";
import type { CampaignAgentOutput, GameAgentContext } from "@/lib/ai/agents/types";
import { daysUntilGame, pickStrategy } from "@/lib/utils";

function buildFallback(game: GameAgentContext): CampaignAgentOutput {
  const daysLeft = daysUntilGame(game.date);
  const strategy = pickStrategy(daysLeft);
  const goalSeats = game.seatsTotal - game.seatsTaken;

  return {
    strategy: strategy.name,
    daysLeft,
    goalSeats,
    accents: [
      `Город: ${game.city}, дата: ${new Date(game.date).toLocaleDateString("ru-RU")}`,
      `Осталось ${daysLeft} дней до игры`,
      `Цель: заполнить ${goalSeats} мест`,
      strategy.description,
    ],
    metrics: [
      "Переходы на лендинг",
      "Количество заявок",
      "Конверсия заявка → оплата",
      "CTR по площадкам",
      "Горячие лиды для ведущего",
    ],
  };
}

export async function runCampaignAgent(game: GameAgentContext): Promise<CampaignAgentOutput> {
  const daysLeft = daysUntilGame(game.date);
  const goalSeats = game.seatsTotal - game.seatsTaken;
  const fallback = buildFallback(game);

  const systemPrompt = `Ты — AI-агент кампании для игры «Система».
Твоя задача: выбрать маркетинговую стратегию для конкретной игры.

ПРАВИЛА:
- Работаешь ТОЛЬКО с игрой «Система»
- Используй только факты из базы знаний
- Не придумывай цены и даты
- Ответ строго в JSON без markdown

БАЗА ЗНАНИЙ:
${KNOWLEDGE_BASE.gameDescription}

СТРАТЕГИИ ПО СРОКАМ:
- 28+ дней: Большая кампания
- 14-27 дней: Интенсивная кампания
- 5-13 дней: Максимальный прогрев
- <5 дней: Срочная кампания`;

  const userPrompt = `Игра:
- ID: ${game.id}
- Город: ${game.city}
- Дата: ${new Date(game.date).toLocaleDateString("ru-RU")}, ${game.time}
- Цена: ${game.price} ₽
- Мест: ${goalSeats} свободно из ${game.seatsTotal}
- Дней до игры: ${daysLeft}
- Ведущий: ${game.leaderName}

Верни JSON:
{
  "strategy": "название стратегии",
  "daysLeft": ${daysLeft},
  "goalSeats": ${goalSeats},
  "accents": ["акцент 1", "акцент 2", "акцент 3"],
  "metrics": ["метрика 1", "метрика 2", "метрика 3"]
}`;

  const result = await runAgentJson<CampaignAgentOutput>({
    agent: "campaign",
    gameId: game.id,
    systemPrompt,
    userPrompt,
    fallback: () => fallback,
    validate: (data) =>
      Boolean(data.strategy && data.accents?.length >= 2 && data.metrics?.length >= 2),
  });

  return {
    ...fallback,
    ...result.data,
    daysLeft,
    goalSeats,
  };
}

export { PLATFORMS };
