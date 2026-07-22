import { prisma } from "@/lib/db";
import { KNOWLEDGE_BASE } from "@/lib/knowledge-base";
import { daysUntilGame, pickStrategy } from "@/lib/utils";

export async function initializeCampaign(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new Error("Игра не найдена");

  const daysLeft = daysUntilGame(game.date);
  const strategy = pickStrategy(daysLeft);
  const seatsLeft = game.seatsTotal - game.seatsTaken;

  const accents = [
    `Город: ${game.city}, дата: ${new Date(game.date).toLocaleDateString("ru-RU")}`,
    `Осталось ${daysLeft} дней до игры`,
    `Цель: заполнить ${seatsLeft} мест`,
    strategy.description,
  ];

  const metrics = [
    "Переходы на лендинг",
    "Количество заявок",
    "Конверсия заявка → оплата",
    "CTR по площадкам",
    "Горячие лиды для ведущего",
  ];

  const campaign = await prisma.campaign.upsert({
    where: { gameId },
    update: {
      strategy: strategy.name,
      daysLeft,
      goalSeats: seatsLeft,
      accents: JSON.stringify(accents),
      metrics: JSON.stringify(metrics),
    },
    create: {
      gameId,
      strategy: strategy.name,
      daysLeft,
      goalSeats: seatsLeft,
      accents: JSON.stringify(accents),
      metrics: JSON.stringify(metrics),
    },
  });

  return { campaign, strategy, daysLeft, accents, metrics };
}

export function getLandingData(game: {
  title: string;
  date: Date;
  time: string;
  city: string;
  address: string;
  price: number;
  seatsTotal: number;
  seatsTaken: number;
  leaderName: string;
  leaderPhoto: string | null;
  leaderBio: string | null;
  slug: string;
}) {
  const dateStr = new Date(game.date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });

  return {
    hero: {
      tagline: KNOWLEDGE_BASE.gameFormat.tagline,
      title: "Проживи 30 лет своей жизни за 2,5 часа",
      subtitle: `Узнай, какие ошибки в ключевых сферах жизни ты совершал — и какие ещё можешь избежать. Три главные системы: здоровье, отношения и деньги.`,
      meta: `${dateStr} · ${game.time} · ${game.city} · Офлайн`,
    },
    stats: [
      { value: ">2000", label: "партий проведено" },
      { value: ">300", label: "лидерских команд" },
      { value: ">500", label: "постоянных игроков" },
      { value: "с 2001", label: "метод «Системы»" },
    ],
    problem: {
      title: "Посмотри на ситуацию шире — и найди решение, которое раньше было незаметным",
      text: "Иногда кажется, что ты зашёл в тупик. Бизнес не растёт так, как хотелось бы. В команде возникают повторяющиеся сложности. Личные цели откладываются, а новые идеи не складываются в единую картину. Часто проблема не в отсутствии решений, а в том, что мы смотрим только на один фрагмент ситуации.",
    },
    levels: [
      { num: "01", title: "Что происходит сейчас", text: "Текущая точка: что происходит в здоровье, отношениях и деньгах прямо сейчас." },
      { num: "02", title: "Связь с прошлым", text: "Как ситуация связана с прошлым: откуда пришли повторяющиеся сценарии." },
      { num: "03", title: "Сценарии будущего", text: "Какие сценарии могут сформировать будущее — и где развилки, меняющие маршрут." },
      { num: "04", title: "Внешние и внутренние системы", text: "Какие системы влияют на результат и удерживают в прежнем контуре." },
    ],
    targetAudience: KNOWLEDGE_BASE.targetAudience,
    outcomes: KNOWLEDGE_BASE.outcomes,
    process: KNOWLEDGE_BASE.gameFormat.process,
    whyGame: KNOWLEDGE_BASE.whyGame,
    formatOnePlusOne: KNOWLEDGE_BASE.gameFormat.formatOnePlusOne,
    description: KNOWLEDGE_BASE.gameDescription,
    leader: {
      name: game.leaderName,
      photo: game.leaderPhoto,
      bio: game.leaderBio ?? "Сертифицированный ведущий трансформационной игры «Система».",
      label: "Ведёт игру",
    },
    reviews: KNOWLEDGE_BASE.reviews,
    faq: KNOWLEDGE_BASE.faq,
    pricing: {
      price: game.price,
      seatsTotal: game.seatsTotal,
      seatsLeft: game.seatsTotal - game.seatsTaken,
      includes: [
        "2,5–3 часа живой игры-разбора",
        "Системный разбор здоровья, отношений и денег",
        "Личная карта решений и следующих шагов",
        game.address,
      ],
    },
    legal: KNOWLEDGE_BASE.legal,
    slug: game.slug,
    gameInfo: {
      date: dateStr,
      time: game.time,
      city: game.city,
      address: game.address,
    },
  };
}
