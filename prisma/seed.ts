import { prisma } from "@/lib/db";

async function main() {
  await prisma.leader.upsert({
    where: { email: "leader@sistema.game" },
    update: {},
    create: {
      name: "Дмитрий Шкаров",
      email: "leader@sistema.game",
      description:
        "Серийный предприниматель, автор игры «Система». 20 лет в бизнесе, более 2000 проведённых партий.",
      telegram: "https://t.me/shkarovbiz",
      vk: "https://vk.com/sistema_leader",
    },
  });

  console.log("Seed completed");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
