import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clapperboard } from "lucide-react";
import { ContentPlanList } from "@/components/ContentPlanList";
import { RegenerateContentButton } from "@/components/RegenerateContentButton";
import { AppHeader } from "@/components/AppHeader";
import { getGameDashboard } from "@/lib/services/game";
import { formatGameDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ContentPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGameDashboard(id);
  if (!game) notFound();

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <Link
          href={`/games/${game.id}`}
          className="inline-flex items-center gap-2 text-[var(--muted)] mb-6 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к игре
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Clapperboard className="w-8 h-8 text-[var(--accent-2)]" />
            <h1 className="text-3xl font-bold">Контент-план</h1>
          </div>
          <p className="text-[var(--muted)] max-w-3xl">
            {game.title} · {formatGameDate(new Date(game.date))}, {game.time} · {game.city} ·{" "}
            {formatPrice(game.price)}
          </p>
          <p className="text-sm text-[var(--muted)] mt-2">
            Контент-фабрика по ТЗ: статусы DRAFT → HUMAN_REVIEW → APPROVED → PUBLISHED.
            Утверждайте, копируйте и публикуйте вручную (режим C).
          </p>
          <div className="mt-4">
            <RegenerateContentButton gameId={game.id} />
          </div>
        </div>

        <ContentPlanList
          gameId={game.id}
          items={game.contentItems.map((item) => ({
            ...item,
            scheduledAt: item.scheduledAt.toISOString(),
          }))}
        />
      </main>
    </div>
  );
}
