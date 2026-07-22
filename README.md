# Система AI OS

AI Operating System для сертифицированных ведущих трансформационной игры «Система».

## Возможности

- Создание игры и автозапуск маркетинговой кампании
- Генерация лендинга по фиксированному шаблону
- Контент-календарь с UTM-метками
- Приём заявок и AI Sales (квалификация по стадиям)
- Передача горячих лидов ведущему
- Аналитика по площадкам и конверсиям

## AI-агенты (Qwen 3.7)

При запуске игры оркестратор последовательно запускает агентов:

| Агент | Задача |
|-------|--------|
| **Campaign** | Стратегия, акценты, метрики |
| **Content** | Контент-план (темы, хуки, CTA) |
| **Distribution** | Расписание по площадкам |
| **Sales** | Диалог с лидами на лендинге |

Код: `lib/ai/agents/`. Журнал работы — на странице игры.

## Qwen AI

В `.env` укажите ключ и endpoint из Alibaba Cloud Model Studio:

```env
QWEN_API_KEY=sk-ws-...
QWEN_BASE_URL=https://your-workspace.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen3.7-plus
```

AI Sales использует Qwen для ответов клиентам. Если API недоступен — работает резервная rule-based логика.

## Запуск

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## Маршруты

| URL | Описание |
|-----|----------|
| `/` | Панель ведущего |
| `/games/new` | Создание игры |
| `/games/[id]` | Управление кампанией |
| `/l/[slug]` | Публичный лендинг |

## API

- `GET/POST /api/games` — список и создание игр
- `GET /api/games/[id]` — детали игры и аналитика
- `POST/PATCH /api/leads` — заявки и AI-диалог
- `GET /api/landing/[slug]` — данные лендинга

## Стек

- Next.js 15 + TypeScript
- Prisma + SQLite
- Tailwind CSS 4

## Логика AI

Реализована на основе `system-prompt.md`:

1. Выбор стратегии кампании по дням до игры
2. Генерация контента из базы знаний
3. AI Sales по сценариям (unknown → interested → wants_to_come → paid)
4. Handoff горячих лидов ведущему при score ≥ 70%
