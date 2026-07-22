import { prisma } from "@/lib/db";
import { PRODUCT_ID } from "@/lib/tz/constants";

const BLOCKED_PATTERNS = [
  /консультац/i,
  /курс/i,
  /наставнич/i,
  /магазин/i,
  /чуж(ой|ая|ие)\s+(продукт|игр)/i,
  /сторонн/i,
  /франшиз(а|ы)/i,
  /продай\s+(мою|мой|моё)/i,
];

const ALLOWED_DOMAINS = [
  "shkarovsystem.ru",
  "t.me",
  "telegram",
  "localhost",
  "system.game",
];

export type GuardResult = {
  allowed: boolean;
  reason?: string;
  violations: string[];
};

export function checkProductGuard(text: string): GuardResult {
  const violations: string[] = [];

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      violations.push(`Запрещённый паттерн: ${pattern.source}`);
    }
  }

  const urls = text.match(/https?:\/\/[^\s]+/gi) ?? [];
  for (const url of urls) {
    const allowed = ALLOWED_DOMAINS.some((d) => url.includes(d)) || url.includes("/l/");
    if (!allowed) {
      violations.push(`Неразрешённая ссылка: ${url}`);
    }
  }

  return {
    allowed: violations.length === 0,
    reason: violations[0],
    violations,
  };
}

export async function logGuardViolation(
  gameId: string,
  input: string,
  result: GuardResult,
) {
  if (result.allowed) return;

  await prisma.auditEvent.create({
    data: {
      gameId,
      actor: "product_guard",
      action: "BLOCK",
      reason: result.reason ?? "Product Guard violation",
      payload: JSON.stringify({ input: input.slice(0, 500), violations: result.violations }),
    },
  });

  await prisma.agentRun.create({
    data: {
      gameId,
      agent: "product_guard",
      source: "ai",
      input: input.slice(0, 500),
      output: JSON.stringify(result),
      note: result.reason,
    },
  });
}

export function assertSystemGameOnly(productId?: string) {
  if (productId && productId !== PRODUCT_ID) {
    throw new Error("Система работает только с игрой «Система» (SYSTEM_GAME)");
  }
}
