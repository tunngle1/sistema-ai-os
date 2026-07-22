const API_KEY = process.env.QWEN_API_KEY ?? process.env.DASHSCOPE_API_KEY;
const BASE_URL =
  process.env.QWEN_BASE_URL ??
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const MODEL = process.env.QWEN_MODEL ?? "qwen3.7-plus";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function isQwenConfigured(): boolean {
  return Boolean(API_KEY && BASE_URL && MODEL);
}

export async function qwenChat(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<string> {
  if (!API_KEY) {
    throw new Error("QWEN_API_KEY не задан");
  }

  const url = `${BASE_URL.replace(/\/$/, "")}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options?.temperature ?? 0.6,
      max_tokens: options?.maxTokens ?? 800,
      enable_thinking: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Qwen API ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Qwen API вернул пустой ответ");
  }

  return content;
}
