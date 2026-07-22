import {
  DISTRIBUTION_SCHEDULE,
  KNOWLEDGE_BASE,
} from "@/lib/knowledge-base";
import { runAgentJson } from "@/lib/ai/agents/base";
import { buildFallbackBrief, formatForPlatform } from "@/lib/content/formats";
import type {
  CampaignAgentOutput,
  ContentAgentOutput,
  ContentPlanItem,
  GameAgentContext,
} from "@/lib/ai/agents/types";
import { daysUntilGame, pickStrategy } from "@/lib/utils";

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function enrichItem(
  game: GameAgentContext,
  item: Partial<ContentPlanItem>,
  index: number,
): ContentPlanItem {
  const schedule = DISTRIBUTION_SCHEDULE[index % DISTRIBUTION_SCHEDULE.length];
  const platform = item.platform ?? schedule.platform;
  const topic = item.topic || pick(KNOWLEDGE_BASE.contentTopics, index);
  const hook = (item.hook || pick(KNOWLEDGE_BASE.hooks, index)).replace(
    "N",
    String(game.seatsTotal - game.seatsTaken),
  );
  const cta = item.cta || pick(KNOWLEDGE_BASE.ctas, index);
  const landingPath = `/l/${game.slug}`;

  const brief = buildFallbackBrief({
    platform,
    topic,
    hook,
    cta,
    game: {
      city: game.city,
      date: game.date,
      time: game.time,
      price: game.price,
      leaderName: game.leaderName,
      seatsLeft: game.seatsTotal - game.seatsTaken,
    },
    landingPath,
  });

  return {
    dayOffset: item.dayOffset ?? index,
    time: item.time ?? schedule.time,
    platform,
    formatType: item.formatType || formatForPlatform(platform),
    topic,
    hook,
    cta,
    shootBrief: item.shootBrief || brief.shootBrief,
    script: item.script || brief.script,
    postText: item.postText || brief.postText,
  };
}

function buildFallbackItems(game: GameAgentContext): ContentPlanItem[] {
  const daysLeft = daysUntilGame(game.date);
  const strategy = pickStrategy(daysLeft);
  const campaignDays = Math.min(Math.max(daysLeft, 3), 14);
  const postsPerDay = Math.max(2, Math.round(2 * strategy.contentMultiplier));
  const items: ContentPlanItem[] = [];
  let index = 0;

  for (let day = 0; day < campaignDays; day++) {
    for (let p = 0; p < postsPerDay; p++) {
      const schedule = DISTRIBUTION_SCHEDULE[p % DISTRIBUTION_SCHEDULE.length];
      items.push(
        enrichItem(
          game,
          {
            dayOffset: day,
            time: schedule.time,
            platform: schedule.platform,
            topic: pick(KNOWLEDGE_BASE.contentTopics, index),
            hook: pick(KNOWLEDGE_BASE.hooks, index),
            cta: pick(KNOWLEDGE_BASE.ctas, index),
          },
          index,
        ),
      );
      index++;
    }
  }

  return items;
}

export async function runContentAgent(
  game: GameAgentContext,
  campaign: CampaignAgentOutput,
): Promise<ContentAgentOutput> {
  const seatsLeft = game.seatsTotal - game.seatsTaken;
  const daysLeft = daysUntilGame(game.date);
  const itemCount = Math.min(Math.max(Math.round(daysLeft * 1.2), 6), 14);
  const fallback = { items: buildFallbackItems(game) };

  const systemPrompt = `Ты — AI-агент контента для игры «Система».
Составь ПРАКТИЧЕСКИЙ контент-план для ведущего: что снять, что сказать, готовый текст поста.

ПРАВИЛА:
- Только игра «Система»
- Используй факты из базы знаний, не выдумывай
- Каждый пункт — готовое задание для ведущего
- shootBrief: конкретная инструкция что снять/сделать
- script: что говорить в кадре или структура текста
- postText: готовый текст для публикации (можно копировать)
- formatType: short | video | post | story | article
- Ответ строго JSON

БАЗА ЗНАНИЙ:
${KNOWLEDGE_BASE.gameDescription}

ТЕМЫ:
${KNOWLEDGE_BASE.contentTopics.map((t) => `- ${t}`).join("\n")}`;

  const userPrompt = `Стратегия: ${campaign.strategy}
Игра: ${game.city}, ${new Date(game.date).toLocaleDateString("ru-RU")}, ${game.time}
Ведущий: ${game.leaderName}
Цена: ${game.price} ₽, мест: ${seatsLeft}, дней до игры: ${daysLeft}
Лендинг: /l/${game.slug}

Сгенерируй ${itemCount} единиц контента. JSON:
{
  "items": [
    {
      "dayOffset": 0,
      "time": "09:00",
      "platform": "Telegram",
      "formatType": "post",
      "topic": "тема",
      "hook": "хук для первой строки",
      "cta": "призыв к действию",
      "shootBrief": "что именно снять или подготовить",
      "script": "сценарий или структура",
      "postText": "готовый текст поста для копирования"
    }
  ]
}`;

  const result = await runAgentJson<ContentAgentOutput>({
    agent: "content",
    gameId: game.id,
    systemPrompt,
    userPrompt,
    fallback: () => fallback,
    validate: (data) => Array.isArray(data.items) && data.items.length >= 3,
  });

  return {
    items: result.data.items.slice(0, 20).map((item, i) => enrichItem(game, item, i)),
  };
}
