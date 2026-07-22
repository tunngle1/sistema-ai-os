import { prisma } from "@/lib/db";
import { ANALYTICS_EVENTS } from "@/lib/tz/constants";

export async function trackEvent(params: {
  gameId: string;
  eventType: (typeof ANALYTICS_EVENTS)[number];
  leadId?: string;
  contentId?: string;
  payload?: Record<string, unknown>;
}) {
  return prisma.analyticsEvent.create({
    data: {
      gameId: params.gameId,
      eventType: params.eventType,
      leadId: params.leadId,
      contentId: params.contentId,
      payload: params.payload ? JSON.stringify(params.payload) : null,
    },
  });
}

export async function getFunnelAnalytics(gameId: string) {
  const [events, leads, content] = await Promise.all([
    prisma.analyticsEvent.findMany({ where: { gameId }, orderBy: { createdAt: "asc" } }),
    prisma.lead.findMany({ where: { gameId } }),
    prisma.contentItem.findMany({ where: { gameId } }),
  ]);

  const counts: Record<string, number> = {};
  for (const e of ANALYTICS_EVENTS) counts[e] = 0;

  for (const ev of events) {
    if (ev.eventType in counts) counts[ev.eventType]++;
  }

  counts.LEAD_CREATED = Math.max(counts.LEAD_CREATED, leads.length);
  counts.QUALIFIED = leads.filter((l) =>
    ["QUALIFIED", "HOT", "PAYMENT_LINK_SENT", "PAYMENT_STARTED", "PAID", "CONFIRMED", "ATTENDED"].includes(l.stage),
  ).length;
  counts.PAID = leads.filter((l) => ["PAID", "CONFIRMED", "ATTENDED"].includes(l.stage) || l.paid).length;
  counts.CONFIRMED = leads.filter((l) => ["CONFIRMED", "ATTENDED"].includes(l.stage)).length;
  counts.ATTENDED = leads.filter((l) => l.stage === "ATTENDED").length;

  const contentByStatus = content.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  const published = content.filter((c) => c.status === "PUBLISHED");
  const totalReach = published.reduce((s, c) => s + c.reach, 0);
  const totalClicks = published.reduce((s, c) => s + c.clicks, 0);

  return {
    funnel: counts,
    contentByStatus,
    totalReach,
    totalClicks,
    leadsCount: leads.length,
    hotLeadsCount: leads.filter((l) => l.handedToLeader || l.purchaseScore >= 70).length,
    conversionRate: leads.length > 0 ? (counts.PAID / leads.length) * 100 : 0,
  };
}
