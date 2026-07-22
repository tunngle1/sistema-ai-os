"use client";

import { useState } from "react";
import { Copy, Check, Shield } from "lucide-react";
import { ContentApprovalActions } from "@/components/ContentApprovalActions";
import { FORMAT_LABELS, STATUS_LABELS, unitTypeLabel, type ContentFormat } from "@/lib/content/formats";

type QcReport = {
  passed: boolean;
  checks: Array<{ name: string; passed: boolean; message?: string }>;
};

type ContentItem = {
  id: string;
  gameId: string;
  platform: string;
  unitType?: string;
  formatType: string;
  topic: string;
  hook: string;
  cta: string;
  ctaType?: string | null;
  visualStyle?: string | null;
  aspectRatio?: string | null;
  durationSec?: number | null;
  isPrimaryVertical?: boolean;
  isCrossPublish?: boolean;
  shootBrief: string;
  script: string;
  postText: string;
  landingUrl: string;
  scheduledAt: string | Date;
  status: string;
  blockReason?: string | null;
  qcResults?: string | null;
  similarityScore?: number | null;
  requiresHumanApproval?: boolean;
  sourceUnit?: { sourceId: string } | null;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={copy} className="btn btn-secondary text-xs py-2 px-3">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Скопировано" : "Копировать"}
    </button>
  );
}

function QcPanel({ qcResults }: { qcResults?: string | null }) {
  if (!qcResults) return null;
  try {
    const qc = JSON.parse(qcResults) as QcReport;
    return (
      <div className="mt-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
        <div className="flex items-center gap-2 text-xs font-semibold mb-2">
          <Shield className="w-3 h-3" />
          QC {qc.passed ? "✓ пройден" : "✗ не пройден"}
        </div>
        <div className="flex flex-wrap gap-1">
          {qc.checks.map((c) => (
            <span
              key={c.name}
              className={`badge text-[10px] ${c.passed ? "badge-green" : "badge-red"}`}
              title={c.message}
            >
              {c.name}
            </span>
          ))}
        </div>
      </div>
    );
  } catch {
    return null;
  }
}

export function ContentPlanList({ items, gameId }: { items: ContentItem[]; gameId: string }) {
  const grouped = items.reduce<Record<number, ContentItem[]>>((acc, item) => {
    const day = new Date(item.scheduledAt);
    day.setHours(0, 0, 0, 0);
    const key = day.getTime();
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const days = Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b));
  const primaryVerticalByDay = days.map(([dayKey, dayItems]) => ({
    dayKey,
    count: dayItems.filter((i) => i.isPrimaryVertical).length,
  }));

  if (items.length === 0) {
    return (
      <div className="card p-10 text-center text-[var(--muted)]">
        Контент-план ещё не создан. Запустите игру заново или создайте новую.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="card p-4 text-sm text-[var(--muted)]">
        Контентная фабрика: до 5 уникальных vertical/день · 1 source unit → адаптации под площадки ·
        QC: Product Guard, claims, voice, duplicates, platform
      </div>

      {days.map(([dayKey, dayItems]) => {
        const date = new Date(Number(dayKey));
        const verticalCount = dayItems.filter((i) => i.isPrimaryVertical).length;
        return (
          <section key={dayKey}>
            <h3 className="text-lg font-bold mb-4">
              {date.toLocaleDateString("ru-RU", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              <span className="text-[var(--muted)] font-normal ml-2">
                · {dayItems.length} адаптаций · {verticalCount} unique vertical
              </span>
            </h3>
            <div className="space-y-4">
              {dayItems.map((item) => (
                <article key={item.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.sourceUnit?.sourceId && (
                          <span className="badge badge-purple">{item.sourceUnit.sourceId}</span>
                        )}
                        <span className="badge badge-purple">{item.platform}</span>
                        <span className="badge badge-green">
                          {item.unitType ? unitTypeLabel(item.unitType) : FORMAT_LABELS[item.formatType as ContentFormat] ?? item.formatType}
                        </span>
                        <span className="badge badge-orange">
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>
                        {item.isCrossPublish && (
                          <span className="badge badge-purple">кросс-публикация</span>
                        )}
                        {item.requiresHumanApproval && (
                          <span className="badge badge-red">нужен OK</span>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold">{item.topic}</h4>
                      <p className="text-sm text-[var(--muted)] mt-1">
                        {new Date(item.scheduledAt).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {item.aspectRatio && ` · ${item.aspectRatio}`}
                        {item.durationSec && ` · ${item.durationSec} сек`}
                        {item.visualStyle && ` · ${item.visualStyle}`}
                        {item.ctaType && ` · CTA: ${item.ctaType}`}
                        {item.similarityScore != null &&
                          item.similarityScore > 0 &&
                          ` · sim ${(item.similarityScore * 100).toFixed(0)}%`}
                      </p>
                      {item.blockReason && (
                        <p className="text-xs text-[var(--danger)] mt-1">{item.blockReason}</p>
                      )}
                      <QcPanel qcResults={item.qcResults} />
                    </div>
                    <ContentApprovalActions itemId={item.id} gameId={gameId} status={item.status} />
                  </div>

                  <div className="grid lg:grid-cols-3 gap-4">
                    <div className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]">
                      <div className="text-xs uppercase tracking-wide text-[var(--accent-2)] mb-2 font-semibold">
                        Platform brief — что снять
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.shootBrief}</p>
                    </div>

                    <div className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]">
                      <div className="text-xs uppercase tracking-wide text-[var(--accent)] mb-2 font-semibold">
                        Сценарий
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.script}</p>
                    </div>

                    <div className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs uppercase tracking-wide text-[var(--warning)] font-semibold">
                          Draft — текст публикации
                        </div>
                        <CopyButton text={item.postText} />
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.postText}</p>
                      <div className="mt-3 pt-3 border-t border-[var(--border)] text-xs text-[var(--muted)]">
                        CTA: {item.cta} · {item.landingUrl}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <div className="text-xs text-[var(--muted)]">
        Unique vertical по дням:{" "}
        {primaryVerticalByDay.map((d) => `${new Date(Number(d.dayKey)).getDate()}.${new Date(Number(d.dayKey)).getMonth() + 1}: ${d.count}`).join(" · ")}
      </div>
    </div>
  );
}
