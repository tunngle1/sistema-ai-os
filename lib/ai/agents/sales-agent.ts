import { runAgentText } from "@/lib/ai/agents/base";
import { buildSalesSystemPrompt, buildWelcomePrompt } from "@/lib/ai/sales-prompt";
import type { LeadStageTz } from "@/lib/tz/lead-status";
import type { AgentSource, GameAgentContext } from "@/lib/ai/agents/types";

export async function runSalesReplyAgent(params: {
  game: GameAgentContext;
  gameId: string;
  stage: LeadStageTz | string;
  history: Array<{ role: string; content: string }>;
  userMessage: string;
  fallback: () => string;
}): Promise<{ reply: string; source: AgentSource }> {
  const result = await runAgentText({
    agent: "sales_lidorub",
    gameId: params.gameId,
    systemPrompt: buildSalesSystemPrompt(params.game, params.stage),
    userPrompt: [
      ...params.history.map(
        (m) => `${m.role === "user" ? "Клиент" : "AI"}: ${m.content}`,
      ),
      `Клиент: ${params.userMessage}`,
      "Ответь клиенту:",
    ].join("\n"),
    fallback: params.fallback,
  });

  return { reply: result.data, source: result.source };
}

export async function runSalesWelcomeAgent(params: {
  game: GameAgentContext;
  gameId: string;
  leadName: string;
  fallback: () => string;
}): Promise<{ reply: string; source: AgentSource }> {
  const result = await runAgentText({
    agent: "sales_lidorub",
    gameId: params.gameId,
    systemPrompt: buildWelcomePrompt(params.game, params.leadName),
    userPrompt: "Напиши приветственное сообщение клиенту.",
    fallback: params.fallback,
  });

  return { reply: result.data, source: result.source };
}
