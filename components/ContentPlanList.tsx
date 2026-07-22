"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { ContentApprovalActions } from "@/components/ContentApprovalActions";
import { FORMAT_LABELS, STATUS_LABELS, type ContentFormat } from "@/lib/content/formats";

type ContentItem = {
  id: string;
  gameId: string;
  platform: string;
  formatType: string;
  topic: string;
  hook: string;
  cta: string;
  shootBrief: string;
  script: string;
  postText: string;
  landingUrl: string;
  scheduledAt: string | Date;
  status: string;
  blockReason?: string | null;
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

  if (items.length === 0) {
    return (
      <div className="card p-10 text-center text-[var(--muted)]">
        Контент-план ещё не создан. Запустите игру заново или создайте новую.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {days.map(([dayKey, dayItems]) => {
        const date = new Date(Number(dayKey));
        return (
          <section key={dayKey}>
            <h3 className="text-lg font-bold mb-4">
              {date.toLocaleDateString("ru-RU", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              <span className="text-[var(--muted)] font-normal ml-2">
                · {dayItems.length} {dayItems.length === 1 ? "публикация" : "публикации"}
              </span>
            </h3>
            <div className="space-y-4">
              {dayItems.map((item) => (
                <article key={item.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="badge badge-purple">{item.platform}</span>
                        <span className="badge badge-green">
                          {FORMAT_LABELS[item.formatType as ContentFormat] ?? item.formatType}
                        </span>
                        <span className="badge badge-orange">
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold">{item.topic}</h4>
                      <p className="text-sm text-[var(--muted)] mt-1">
                        {new Date(item.scheduledAt).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · Хук: {item.hook}
                      </p>
                      {item.blockReason && (
                        <p className="text-xs text-[var(--danger)] mt-1">{item.blockReason}</p>
                      )}
                    </div>
                    <ContentApprovalActions itemId={item.id} gameId={gameId} status={item.status} />
                  </div>

                  <div className="grid lg:grid-cols-3 gap-4">
                    <div className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]">
                      <div className="text-xs uppercase tracking-wide text-[var(--accent-2)] mb-2 font-semibold">
                        Что снять / сделать
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
                          Готовый текст поста
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
    </div>
  );
}
