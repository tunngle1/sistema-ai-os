import { LEAD_STATUSES } from "@/lib/tz/constants";

export const LEAD_STATUS_LABELS: Record<(typeof LEAD_STATUSES)[number], string> = {
  NEW: "Новый",
  ENGAGED: "В диалоге",
  DIAGNOSTIC_STARTED: "Диагностика начата",
  DIAGNOSTIC_COMPLETED: "Диагностика пройдена",
  QUALIFIED: "Квалифицирован",
  HOT: "Горячий",
  LEADER_ASSIGNED: "Передан ведущему",
  CALL_SCHEDULED: "Звонок назначен",
  PAYMENT_LINK_SENT: "Ссылка на оплату",
  PAYMENT_STARTED: "Оплата начата",
  PAID: "Оплачен",
  CONFIRMED: "Подтверждён",
  ATTENDED: "Пришёл на игру",
  NO_SHOW: "Не пришёл",
  REFUND: "Возврат",
  DECLINED: "Отказ",
  ESCALATED: "Эскалация",
};

export type LeadStageTz = (typeof LEAD_STATUSES)[number];

export function isHotLead(stage: string, purchaseScore: number) {
  return (
    purchaseScore >= 70 ||
    ["HOT", "PAYMENT_LINK_SENT", "PAYMENT_STARTED", "LEADER_ASSIGNED", "ESCALATED"].includes(stage)
  );
}

export function isPaidStage(stage: string) {
  return ["PAID", "CONFIRMED", "ATTENDED"].includes(stage);
}
