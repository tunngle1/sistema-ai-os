import { prisma } from "@/lib/db";
import { isQwenConfigured, qwenChat } from "@/lib/ai/qwen";
import type { AgentSource } from "@/lib/ai/agents/types";

export function parseAgentJson<T>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(jsonText) as T;
}

export async function runAgentJson<T>(params: {
  agent: string;
  gameId: string;
  systemPrompt: string;
  userPrompt: string;
  fallback: () => T;
  validate?: (data: T) => boolean;
}): Promise<{ data: T; source: AgentSource; summary: string }> {
  if (!isQwenConfigured()) {
    const data = params.fallback();
    await logAgentRun(params.gameId, params.agent, "fallback", params.userPrompt, data, "AI не настроен");
    return { data, source: "fallback", summary: "Использована резервная логика" };
  }

  try {
    const raw = await qwenChat(
      [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      { temperature: 0.5, maxTokens: 3000 },
    );

    const data = parseAgentJson<T>(raw);
    if (params.validate && !params.validate(data)) {
      throw new Error("Ответ агента не прошёл валидацию");
    }

    await logAgentRun(params.gameId, params.agent, "ai", params.userPrompt, data, "Сгенерировано AI");
    return { data, source: "ai", summary: "Сгенерировано AI-агентом" };
  } catch (error) {
    console.error(`Agent ${params.agent} error:`, error);
    const data = params.fallback();
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    await logAgentRun(params.gameId, params.agent, "fallback", params.userPrompt, data, message);
    return { data, source: "fallback", summary: `Резервная логика: ${message}` };
  }
}

export async function runAgentText(params: {
  agent: string;
  gameId: string;
  systemPrompt: string;
  userPrompt: string;
  fallback: () => string;
}): Promise<{ data: string; source: AgentSource }> {
  if (!isQwenConfigured()) {
    const data = params.fallback();
    await logAgentRun(params.gameId, params.agent, "fallback", params.userPrompt, { text: data });
    return { data, source: "fallback" };
  }

  try {
    const data = await qwenChat([
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userPrompt },
    ]);
    await logAgentRun(params.gameId, params.agent, "ai", params.userPrompt, { text: data });
    return { data, source: "ai" };
  } catch (error) {
    console.error(`Agent ${params.agent} error:`, error);
    const data = params.fallback();
    await logAgentRun(params.gameId, params.agent, "fallback", params.userPrompt, { text: data });
    return { data, source: "fallback" };
  }
}

async function logAgentRun(
  gameId: string,
  agent: string,
  source: AgentSource,
  input: string,
  output: unknown,
  note?: string,
) {
  await prisma.agentRun.create({
    data: {
      gameId,
      agent,
      source,
      input: input.slice(0, 2000),
      output: JSON.stringify(output).slice(0, 4000),
      note,
    },
  });
}

export async function logAgentAction(
  gameId: string,
  agent: string,
  source: AgentSource,
  summary: string,
  output?: unknown,
) {
  await prisma.agentRun.create({
    data: {
      gameId,
      agent,
      source,
      input: summary,
      output: output ? JSON.stringify(output).slice(0, 4000) : null,
      note: summary,
    },
  });
}
