"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";

export default function NewGamePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "Игра «Система»",
    date: "",
    time: "19:00",
    city: "Москва",
    address: "м. Павелецкая, ул. Садовническая 78, стр. 5",
    price: "2900",
    seatsTotal: "12",
    targetAttended: "60",
    approvalMode: "C",
    budget: "",
    leaderName: "Дмитрий Шкаров",
    leaderBio:
      "Серийный предприниматель, автор игры «Система». 20 лет в бизнесе, более 2000 проведённых партий.",
    telegram: "https://t.me/shkarovbiz",
    vk: "https://vk.com/sistema_leader",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const game = await res.json();
      if (!res.ok) throw new Error(game.error);

      router.push(`/games/${game.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка создания игры");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Запуск кампании</h1>
        <p className="text-[var(--muted)] mb-8">
          По ТЗ v2.0: только игра «Система», 15 AI-агентов, Product Guard, контент-фабрика и CRM «Ледоруб»
        </p>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div>
            <label className="block text-sm mb-2 text-[var(--muted)]">Название</label>
            <input className="input" value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">Дата игры</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">Время</label>
              <input className="input" value={form.time} onChange={(e) => update("time", e.target.value)} required />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">Город</label>
              <input className="input" value={form.city} onChange={(e) => update("city", e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">Адрес</label>
              <input className="input" value={form.address} onChange={(e) => update("address", e.target.value)} required />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">Стоимость (₽)</label>
              <input className="input" value={form.price} onChange={(e) => update("price", e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">Мест на игру</label>
              <input
                className="input"
                value={form.seatsTotal}
                onChange={(e) => update("seatsTotal", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">Цель кампании (участников)</label>
              <input
                className="input"
                value={form.targetAttended}
                onChange={(e) => update("targetAttended", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">Режим публикации (ТЗ)</label>
              <select
                className="input"
                value={form.approvalMode}
                onChange={(e) => update("approvalMode", e.target.value)}
              >
                <option value="C">C — экспорт (ведущий публикует сам)</option>
                <option value="B">B — подтверждение перед публикацией</option>
                <option value="A">A — автопубликация</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">Бюджет на рекламу (₽, опционально)</label>
              <input className="input" value={form.budget} onChange={(e) => update("budget", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-[var(--muted)]">Имя ведущего</label>
            <input
              className="input"
              value={form.leaderName}
              onChange={(e) => update("leaderName", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-[var(--muted)]">О ведущем</label>
            <textarea
              className="input min-h-[100px]"
              value={form.leaderBio}
              onChange={(e) => update("leaderBio", e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">Telegram</label>
              <input className="input" value={form.telegram} onChange={(e) => update("telegram", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-2 text-[var(--muted)]">VK</label>
              <input className="input" value={form.vk} onChange={(e) => update("vk", e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Запуск 15 агентов..." : "Запустить кампанию"}
          </button>
        </form>
      </main>
    </div>
  );
}
