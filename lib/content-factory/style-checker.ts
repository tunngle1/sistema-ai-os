import type { QcCheckResult } from "@/lib/content-factory/types";

const BANNED_AI_PHRASES = [
  /в\s+заключение\s+хоч/i,
  /в\s+современном\s+мире/i,
  /не\s+секрет\s+что/i,
  /давайте\s+разбер/i,
  /уникальн(ая|ое)\s+возможность/i,
  /это\s+не\s+просто\s+игра/i,
  /погрузимся\s+в\s+мир/i,
  /раскроем\s+потенциал/i,
];

const REQUIRED_TONE = [/систем/i, /ясност|шаг|запрос|разбор/i];

export function checkVoice(text: string, leaderName: string): QcCheckResult {
  for (const pattern of BANNED_AI_PHRASES) {
    if (pattern.test(text)) {
      return {
        name: "voice",
        passed: false,
        message: `Запрещённый ИИ-оборот: «${pattern.source}»`,
      };
    }
  }

  const hasTone = REQUIRED_TONE.some((p) => p.test(text));
  if (!hasTone) {
    return {
      name: "voice",
      passed: false,
      message: "Не соблюдён голос: нужны системность и конкретика, без «продающей воды»",
    };
  }

  if (leaderName && text.includes("ChatGPT")) {
    return { name: "voice", passed: false, message: "Упоминание AI-инструмента в тексте" };
  }

  return { name: "voice", passed: true };
}

export function checkReputation(text: string): QcCheckResult {
  const bad = [
    /скрыт(ая|ой)\s+реклам/i,
    /live\s+эфир\s+прямо\s+сейчас/i,
    /осталось\s+1\s+место\s+срочно/i,
    /только\s+сегодня\s+скидк/i,
  ];
  for (const p of bad) {
    if (p.test(text)) {
      return { name: "reputation", passed: false, message: `Риск репутации: ${p.source}` };
    }
  }
  return { name: "reputation", passed: true };
}
