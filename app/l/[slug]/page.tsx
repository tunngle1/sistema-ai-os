import { notFound } from "next/navigation";
import { LeadChat } from "@/components/LeadChat";
import { prisma } from "@/lib/db";
import { getLandingData } from "@/lib/services/campaign";
import { formatGameDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const game = await prisma.game.findUnique({ where: { slug } });
  if (!game) notFound();

  const landing = getLandingData(game);
  const seatsLeft = game.seatsTotal - game.seatsTaken;

  return (
    <div className="landing-page min-h-screen bg-[#0c0c0e] text-[#f5f0e8]">
      <header className="landing-header sticky top-0 z-50 border-b border-white/10 bg-[#0c0c0e]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="font-bold tracking-wide">Система</div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <a href="#about" className="hover:text-white transition-colors">О игре</a>
            <a href="#for-whom" className="hover:text-white transition-colors">Для кого</a>
            <a href="#leader" className="hover:text-white transition-colors">Ведущий</a>
            <a href="#register" className="hover:text-white transition-colors">Участие</a>
          </nav>
          <a href="#register" className="landing-btn text-sm py-2.5 px-5">
            Зарегистрироваться
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(180,140,60,0.12),transparent_55%)]" />
          <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 relative">
            <p className="text-[#c9a84c] text-sm uppercase tracking-[0.2em] mb-6">
              {landing.gameInfo.city} · {landing.gameInfo.date} · Офлайн
            </p>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] mb-6 max-w-4xl">
              {landing.hero.title}
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-3xl mb-4 leading-relaxed">
              {landing.hero.subtitle}
            </p>
            <p className="text-white/50 mb-10">
              {landing.hero.meta}
            </p>
            <div className="flex flex-wrap gap-4 mb-14">
              <a href="#register" className="landing-btn">
                Зарегистрироваться
              </a>
              {seatsLeft <= 10 && (
                <span className="inline-flex items-center px-4 py-3 rounded-full border border-[#c9a84c]/30 text-[#c9a84c] text-sm">
                  Осталось {seatsLeft} мест
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-white/10">
              {landing.stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl md:text-3xl font-bold text-[#c9a84c]">{stat.value}</div>
                  <div className="text-sm text-white/50 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="max-w-6xl mx-auto px-6 py-20 border-b border-white/10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 max-w-3xl leading-tight">
            {landing.problem.title}
          </h2>
          <p className="text-white/65 leading-relaxed max-w-3xl text-lg">
            {landing.problem.text}
          </p>
          <p className="text-white/65 leading-relaxed max-w-3xl text-lg mt-4">
            Игра «Система» помогает увидеть происходящее объёмно, разобраться в причинах и найти новые возможности для развития.
          </p>
          <a href="#register" className="inline-block mt-8 text-[#c9a84c] hover:underline">
            Попасть на игру →
          </a>
        </section>

        {/* What is the game */}
        <section id="about" className="max-w-6xl mx-auto px-6 py-20 border-b border-white/10">
          <h2 className="text-3xl font-bold mb-4">Что такое игра «Система»?</h2>
          <p className="text-white/60 mb-10 max-w-2xl">
            Каждая ситуация — часть более широкой системы. Во время игры мы исследуем проблему сразу с четырёх уровней.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {landing.levels.map((level) => (
              <div key={level.num} className="landing-card p-6">
                <div className="text-[#c9a84c] text-sm font-bold mb-3">{level.num}</div>
                <h3 className="text-xl font-semibold mb-2">{level.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{level.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* For whom */}
        <section id="for-whom" className="max-w-6xl mx-auto px-6 py-20 border-b border-white/10">
          <h2 className="text-3xl font-bold mb-8">Для кого эта игра?</h2>
          <p className="text-white/60 mb-6">Игра подойдёт, если ты:</p>
          <ul className="grid md:grid-cols-2 gap-4">
            {landing.targetAudience.map((item) => (
              <li key={item} className="flex items-start gap-3 landing-card p-4">
                <span className="text-[#c9a84c] mt-0.5">✓</span>
                <span className="text-white/80">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Outcomes */}
        <section className="max-w-6xl mx-auto px-6 py-20 border-b border-white/10">
          <h2 className="text-3xl font-bold mb-8">Что ты получишь после игры</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {landing.outcomes.map((item) => (
              <div key={item} className="landing-card p-5">
                <span className="text-[#c9a84c] mr-2">→</span>
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </div>
          <a href="#register" className="landing-btn inline-flex mt-10">
            Присоединиться к игре
          </a>
        </section>

        {/* Leader */}
        <section id="leader" className="max-w-6xl mx-auto px-6 py-20 border-b border-white/10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="landing-card p-8 aspect-square max-w-md flex items-center justify-center bg-gradient-to-br from-[#1a1814] to-[#0c0c0e]">
              {landing.leader.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={landing.leader.photo} alt={landing.leader.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-[#c9a84c]/20 border border-[#c9a84c]/30 mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-[#c9a84c]">
                    {landing.leader.name.charAt(0)}
                  </div>
                  <div className="text-white/40 text-sm">{landing.leader.label}</div>
                </div>
              )}
            </div>
            <div>
              <div className="text-[#c9a84c] text-sm uppercase tracking-widest mb-3">
                {landing.leader.label}
              </div>
              <h2 className="text-3xl font-bold mb-4">{landing.leader.name}</h2>
              <p className="text-white/70 leading-relaxed">{landing.leader.bio}</p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-6 py-20 border-b border-white/10">
          <h2 className="text-3xl font-bold mb-10">Как проходит игра</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {landing.process.map((step, i) => (
              <div key={step} className="landing-card p-6">
                <div className="w-10 h-10 rounded-full border border-[#c9a84c]/40 flex items-center justify-center text-[#c9a84c] font-bold mb-4">
                  {i + 1}
                </div>
                <p className="text-white/75 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why game */}
        <section className="max-w-6xl mx-auto px-6 py-20 border-b border-white/10">
          <h2 className="text-3xl font-bold mb-10">Почему именно игра?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {landing.whyGame.map((item) => {
              const [title, ...rest] = item.split(" — ");
              return (
                <div key={item} className="landing-card p-6">
                  <h3 className="font-semibold mb-3 text-[#c9a84c]">{title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{rest.join(" — ") || item}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Reviews */}
        <section className="max-w-6xl mx-auto px-6 py-20 border-b border-white/10">
          <h2 className="text-3xl font-bold mb-8">Отзывы участников</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {landing.reviews.map((review) => (
              <div key={review.name + review.text.slice(0, 20)} className="landing-card p-6">
                <div className="font-semibold mb-3">{review.name}</div>
                <p className="text-white/65 text-sm leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-6xl mx-auto px-6 py-20 border-b border-white/10">
          <h2 className="text-3xl font-bold mb-8">Частые вопросы</h2>
          <div className="space-y-4 max-w-3xl">
            {landing.faq.map((item) => (
              <div key={item.q} className="landing-card p-5">
                <div className="font-semibold mb-2">{item.q}</div>
                <p className="text-sm text-white/60 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Registration */}
        <section id="register" className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Регистрация</h2>
              <p className="text-white/60 mb-8">
                Места ограничены. Офлайн в {game.city}, {formatGameDate(new Date(game.date))}, {game.time}.
                Оставьте заявку — мы свяжемся с вами и подтвердим участие.
              </p>

              <ul className="space-y-3 mb-8">
                {landing.pricing.includes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white/75">
                    <span className="text-[#c9a84c]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="landing-card p-5 mb-8 border-[#c9a84c]/20">
                <div className="font-semibold text-[#c9a84c] mb-2">Формат 1+1</div>
                <p className="text-sm text-white/65 leading-relaxed">{landing.formatOnePlusOne}</p>
              </div>

              <div className="text-4xl font-bold mb-1">{formatPrice(game.price)}</div>
              <div className="text-white/50 text-sm mb-6">
                Участие в игре «Система» · {landing.gameInfo.date} · {game.city}
              </div>

              <p className="text-xs text-white/35">{landing.legal.offer}</p>
            </div>

            <LeadChat gameId={game.id} gameTitle={game.title} />
          </div>
        </section>

        {/* Footer CTA */}
        <section className="border-t border-white/10 bg-[#080809]">
          <div className="max-w-6xl mx-auto px-6 py-16 text-center">
            <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
              Возможно, решение, которое ты так долго искал, уже существует.
              Иногда достаточно просто посмотреть на ситуацию с другого уровня.
            </p>
            <p className="text-white/40 mb-6">
              {landing.gameInfo.date} · {game.city} · {game.time} · Офлайн
            </p>
            <a href="#register" className="landing-btn">
              Регистрация на игру
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/30">
        <div className="font-bold text-white/50 mb-2">Система</div>
        <p>Живая трансформационная игра-разбор</p>
      </footer>
    </div>
  );
}
