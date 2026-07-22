import Link from "next/link";
import { Calendar, ExternalLink, Target, Users } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { prisma } from "@/lib/db";
import { formatGameDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      campaign: true,
      _count: { select: { leads: true, contentItems: true } },
    },
  });

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="mb-10">
          <h1 className="text-4xl font-bold mb-3">Панель ведущего</h1>
          <p className="text-[var(--muted)] text-lg max-w-3xl">
            AI-операционная система игры «Система» (ТЗ v2.0): 15 агентов, Product Guard,
            контент-фабрика, CRM «Ледоруб» и лендинг под каждую дату.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="card p-5">
            <div className="text-[var(--muted)] text-sm mb-2">Активных игр</div>
            <div className="text-3xl font-bold">{games.filter((g) => g.status === "active").length}</div>
          </div>
          <div className="card p-5">
            <div className="text-[var(--muted)] text-sm mb-2">Всего заявок</div>
            <div className="text-3xl font-bold">
              {games.reduce((sum, g) => sum + g._count.leads, 0)}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-[var(--muted)] text-sm mb-2">Единиц контента</div>
            <div className="text-3xl font-bold">
              {games.reduce((sum, g) => sum + g._count.contentItems, 0)}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold">Ваши игры</h2>
          </div>

          {games.length === 0 ? (
            <div className="card p-10 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-[var(--accent)]" />
              <h3 className="text-xl font-semibold mb-2">Пока нет игр</h3>
              <p className="text-[var(--muted)] mb-6">
                Создайте первую игру — система автоматически запустит кампанию
              </p>
              <Link href="/games/new" className="btn btn-primary">
                Создать игру
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {games.map((game) => (
                <div key={game.id} className="card p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="badge badge-purple">{game.id}</span>
                        <span className="badge badge-green">{game.status}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{game.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatGameDate(new Date(game.date))}, {game.time}
                        </span>
                        <span>{game.city}</span>
                        <span>{formatPrice(game.price)}</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {game.seatsTaken}/{game.seatsTotal} мест
                        </span>
                      </div>
                      {game.campaign && (
                        <p className="text-sm mt-3 text-[var(--muted)]">
                          Стратегия: <span className="text-white">{game.campaign.strategy}</span>
                          {" · "}
                          {game._count.leads} заявок · {game._count.contentItems} публикаций
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Link href={`/games/${game.id}`} className="btn btn-secondary">
                        Управление
                      </Link>
                      <Link
                        href={`/l/${game.slug}`}
                        target="_blank"
                        className="btn btn-primary"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Лендинг
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
