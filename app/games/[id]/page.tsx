import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  Clapperboard,
  ExternalLink,
  Flame,
  MessageSquare,
  Share2,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AGENT_DESCRIPTIONS, AGENT_LABELS } from "@/lib/ai/agents/types";
import { getAnalytics, getGameDashboard } from "@/lib/services/game";
import { buildHandoffCard } from "@/lib/services/sales";
import { publishScheduledContent } from "@/lib/services/content";
import { AGENTS, type AgentId } from "@/lib/tz/constants";
import { LEAD_STATUS_LABELS, isHotLead } from "@/lib/tz/lead-status";
import { formatGameDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await publishScheduledContent(id);

  const game = await getGameDashboard(id);
  if (!game) notFound();

  const analytics = await getAnalytics(id);
  const hotLeads = game.leads.filter((l) => l.handedToLeader || isHotLead(l.stage, l.purchaseScore));
  const accents = game.campaign ? JSON.parse(game.campaign.accents) as string[] : [];
  const metrics = game.campaign ? JSON.parse(game.campaign.metrics) as string[] : [];
  const dailyReport = game.campaign?.dailyReport
    ? JSON.parse(game.campaign.dailyReport) as { bottleneck: string; recommendations: string[] }
    : null;
  const agentIds = Object.keys(AGENTS) as AgentId[];

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--muted)] mb-6 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Назад к играм
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="badge badge-purple">{game.id}</span>
              <span className="badge badge-green">{game.status}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
            <p className="text-[var(--muted)]">
              {formatGameDate(new Date(game.date))}, {game.time} · {game.city} · {formatPrice(game.price)}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/games/${game.id}/content`} className="btn btn-secondary">
              <Clapperboard className="w-4 h-4" />
              Контент-план
            </Link>
            <Link href={`/l/${game.slug}`} target="_blank" className="btn btn-primary">
              <ExternalLink className="w-4 h-4" />
              Открыть лендинг
            </Link>
          </div>
        </div>

        <section className="grid md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Заявки" value={String(analytics.leadsCount)} />
          <StatCard label="Квалифицировано" value={String(analytics.funnel.QUALIFIED ?? 0)} />
          <StatCard label="Оплачено" value={String(analytics.funnel.PAID ?? 0)} />
          <StatCard label="Горячие лиды" value={String(analytics.hotLeadsCount)} accent />
        </section>

        {dailyReport && (
          <section className="card p-6 mb-8 border border-[var(--accent)]/30">
            <h2 className="text-xl font-bold mb-2">Отчёт аналитика</h2>
            <p className="text-[var(--muted)] mb-3">
              Узкое место: <span className="text-white">{dailyReport.bottleneck}</span>
            </p>
            <ul className="text-sm space-y-1">
              {dailyReport.recommendations.map((r) => (
                <li key={r} className="text-[var(--muted)]">• {r}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="card p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-[var(--accent-2)]" />
            <h2 className="text-xl font-bold">AI-агенты</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
            {agentIds.map((agent) => {
              const runs = game.agentRuns.filter((r) => r.agent === agent);
              const lastRun = runs[0];
              return (
                <div key={agent} className="border border-[var(--border)] rounded-xl p-3">
                  <div className="font-semibold text-sm mb-1">{AGENT_LABELS[agent] ?? agent}</div>
                  <div className="text-xs text-[var(--muted)] mb-2 line-clamp-2">
                    {AGENT_DESCRIPTIONS[agent]}
                  </div>
                  {lastRun ? (
                    <span
                      className={`badge ${
                        lastRun.source === "ai" ? "badge-green" : "badge-orange"
                      }`}
                    >
                      {lastRun.source === "ai" ? "AI" : "Резерв"}
                    </span>
                  ) : (
                    <span className="badge badge-purple">Ожидает</span>
                  )}
                </div>
              );
            })}
          </div>
          {game.agentRuns.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-[var(--accent)] mb-3">
                Журнал работы агентов ({game.agentRuns.length})
              </summary>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {game.agentRuns.map((run) => (
                  <div key={run.id} className="border border-[var(--border)] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {AGENT_LABELS[run.agent] ?? run.agent}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {new Date(run.createdAt).toLocaleString("ru-RU")}
                      </span>
                    </div>
                    {run.note && <div className="text-[var(--muted)]">{run.note}</div>}
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
              <h2 className="text-xl font-bold">Кампания</h2>
            </div>
            {game.campaign ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-[var(--muted)]">Стратегия</div>
                  <div className="font-semibold text-lg">{game.campaign.strategy}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-[var(--muted)]">Дней до игры</div>
                    <div className="font-semibold">{game.campaign.daysLeft}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--muted)]">Цель</div>
                    <div className="font-semibold">{game.campaign.goalSeats} мест</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[var(--muted)] mb-2">Ключевые акценты</div>
                  <ul className="space-y-1 text-sm">
                    {accents.map((item) => (
                      <li key={item} className="text-[var(--muted)]">• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm text-[var(--muted)] mb-2">Метрики</div>
                  <div className="flex flex-wrap gap-2">
                    {metrics.map((item) => (
                      <span key={item} className="badge badge-purple">{item}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[var(--muted)]">Кампания не создана</p>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-5 h-5 text-[var(--accent-2)]" />
              <h2 className="text-xl font-bold">Воронка (ТЗ)</h2>
            </div>
            <div className="space-y-2">
              {[
                ["LEAD_CREATED", "Заявки"],
                ["QUALIFIED", "Квалифицировано"],
                ["PAID", "Оплачено"],
                ["CONFIRMED", "Подтверждено"],
                ["ATTENDED", "Пришли"],
              ].map(([key, label]) => (
                <div key={key} className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--muted)]">{label}</span>
                  <span className="font-semibold">{analytics.funnel[key] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-[var(--accent-2)]" />
              <h2 className="text-xl font-bold">Контент-план для съёмки</h2>
              <span className="badge badge-purple">{game.contentItems.length} единиц</span>
            </div>
            <Link href={`/games/${game.id}/content`} className="btn btn-primary">
              Открыть полный план
            </Link>
          </div>
          <p className="text-sm text-[var(--muted)] mb-4">
            Каждая единица содержит: что снять, сценарий и готовый текст поста. Это не автопубликации — это задания для вас.
          </p>
          <div className="space-y-3">
            {game.contentItems.slice(0, 5).map((item) => (
              <div key={item.id} className="border border-[var(--border)] rounded-xl p-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="badge badge-purple">{item.platform}</span>
                  <span className="badge badge-green">{item.formatType}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {new Date(item.scheduledAt).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="font-semibold mb-1">{item.topic}</div>
                <div className="text-sm text-[var(--muted)] line-clamp-2">{item.shootBrief || item.hook}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-[var(--accent)]" />
              <h2 className="text-xl font-bold">Все заявки</h2>
              <span className="badge badge-purple">{game.leads.length}</span>
            </div>
            <div className="space-y-4">
              {game.leads.length === 0 ? (
                <p className="text-[var(--muted)]">Заявок пока нет. Поделитесь лендингом.</p>
              ) : (
                game.leads.map((lead) => (
                  <div key={lead.id} className="border border-[var(--border)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{lead.name}</div>
                      <span className="badge badge-purple">{lead.purchaseScore}%</span>
                    </div>
                    <div className="text-sm text-[var(--muted)] mb-2">
                      {lead.phone} · {LEAD_STATUS_LABELS[lead.stage as keyof typeof LEAD_STATUS_LABELS] ?? lead.stage}
                    </div>
                    {lead.messages[0] && (
                      <p className="text-sm line-clamp-2">{lead.messages.at(-1)?.content}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-[var(--danger)]" />
              <h2 className="text-xl font-bold">Горячие лиды → ведущему</h2>
              <span className="badge badge-red">{hotLeads.length}</span>
            </div>
            <div className="space-y-4">
              {hotLeads.length === 0 ? (
                <p className="text-[var(--muted)]">
                  AI передаст сюда клиентов с высокой вероятностью покупки
                </p>
              ) : (
                hotLeads.map((lead) => {
                  const card = buildHandoffCard({
                    ...lead,
                    game: { id: game.id, city: game.city, date: game.date },
                  });
                  return (
                    <div key={lead.id} className="border border-[var(--danger)]/30 rounded-xl p-4 bg-[rgba(255,92,122,0.05)]">
                      <div className="font-semibold mb-1">{card.name}</div>
                      <div className="text-sm text-[var(--muted)] mb-3">
                        {card.city} · {new Date(card.gameDate).toLocaleDateString("ru-RU")} · {card.purchaseScore}%
                      </div>
                      <div className="text-sm space-y-1 mb-3">
                        <div><span className="text-[var(--muted)]">Стадия:</span> {card.stage}</div>
                        <div><span className="text-[var(--muted)]">Действие:</span> {card.nextAction}</div>
                        {card.objections && (
                          <div><span className="text-[var(--muted)]">Возражения:</span> {card.objections}</div>
                        )}
                      </div>
                      <details className="text-sm">
                        <summary className="cursor-pointer text-[var(--accent)]">История диалога</summary>
                        <pre className="mt-2 whitespace-pre-wrap text-[var(--muted)]">{card.history}</pre>
                      </details>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="text-sm text-[var(--muted)] mb-2">{label}</div>
      <div className={`text-3xl font-bold ${accent ? "text-[var(--danger)]" : ""}`}>{value}</div>
    </div>
  );
}
