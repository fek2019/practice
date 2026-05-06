# Backend: что добавлено и сделано

## Кратко

Проект переведен с прямого использования frontend-заглушек на нормальный backend-слой через Next.js API routes. Фронтенд теперь обращается к `/api/*`, а сервер сам выбирает источник данных: локальная SQLite-БД (по умолчанию), in-memory mock или Supabase.

## Источники данных

| Источник | Когда использовать | Хранилище |
| --- | --- | --- |
| `sqlite` *(default)* | Локальная разработка, прод без внешних сервисов | Файл `data/watchlab.db` |
| `mock` | Быстрая прогонка UI без БД | RAM, теряется при рестарте |
| `supabase` | Прод с управляемым Postgres | Supabase |

Переключается через `APP_DATA_SOURCE` (см. `.env.example`).

## Что добавлено

### Локальная БД (SQLite)

- `src/server/db/sqlite.ts` — соединение `better-sqlite3`, ленивая загрузка нативного модуля, инициализация схемы при первом запуске, WAL, `PRAGMA foreign_keys = ON`.
- Полная DDL-схема (внутри `sqlite.ts`):
  - таблицы `services`, `masters`, `users`, `appointments`, `quick_requests`;
  - `CHECK`-ограничения вместо enum-ов;
  - индексы для фильтров услуг и поиска записей по клиенту/мастеру;
  - **уникальный частичный индекс** `appointments_master_slot_active_uidx` на `(master_id, date, time_slot) WHERE status <> 'done'` — гарантирует, что мастер не получит две активные записи в один слот даже при гонках;
  - триггеры `*_set_updated_at` автоматически обновляют `updated_at`.
- `src/server/db/sqlite-seed.ts` — идемпотентный сид: добавляет демо-услуги, мастеров, пользователей и записи только если соответствующая таблица пустая. Пароли хешируются на лету через `hashPassword`, plaintext в БД не попадает.
- `src/server/repositories/sqlite-repository.ts` — реализация `WorkshopRepository` поверх SQLite. Особенности:
  - выбор оптимального мастера одним SQL-запросом с `NOT EXISTS` + `ORDER BY load`;
  - обработка `SQLITE_CONSTRAINT_UNIQUE` при создании записи → 409 Conflict (защита от race conditions);
  - агрегаты для админ-статистики делаются в БД (SUM, COUNT, JOIN), не в JS;
  - подготовленные запросы (`prepare`) и транзакции на сидах.

### Прежние компоненты (без изменений)

- `src/server/repositories/mock-repository.ts` — локальный режим без БД.
- `src/server/repositories/supabase-repository.ts` — режим Supabase через service role key.
- `src/server/repositories/index.ts` — переключатель источника по `APP_DATA_SOURCE` (теперь поддерживает sqlite).
- API routes:
  - `GET/POST /api/services`
  - `GET/PATCH/DELETE /api/services/[id]`
  - `GET/POST /api/masters`
  - `GET/PATCH/DELETE /api/masters/[id]`
  - `GET/POST /api/appointments`
  - `PATCH /api/appointments/[id]`
  - `GET /api/slots`
  - `POST /api/quick-requests`
  - `GET /api/admin/stats`
  - `POST /api/auth/request-code`
  - `POST /api/auth/login-phone`
  - `POST /api/auth/login-email`
  - `POST /api/auth/demo-role`
  - `GET /api/auth/session`
  - `GET /api/health`
- Авторизация:
  - серверные подписанные session-токены;
  - проверка ролей `client`, `master`, `admin`;
  - email/password вход;
  - телефонный код для входа;
  - demo-role вход для разработки.
- Безопасность:
  - пароли хранятся как `scrypt` hash;
  - админские CRUD routes требуют роль `admin`;
  - мастер может менять только свои заявки;
  - service role key используется только на сервере;
  - native-модуль `better-sqlite3` помечен как `serverExternalPackages` в `next.config.ts`.
- Supabase подготовка:
  - `supabase/schema.sql` — таблицы, enum-типы, индексы, RLS, triggers `updated_at`;
  - `supabase/seed.sql` — стартовые услуги, мастера, пользователи и заявки;
  - `.env.example` — переменные окружения для всех режимов.
- Frontend-подключение:
  - `src/lib/api-client.ts` — клиент для backend API;
  - `src/lib/auth-client.ts` — хранение сессии и auth-запросы;
  - формы записи, быстрые заявки, каталог, мастера и кабинеты переведены на API;
  - страница `/account` больше не заглушка: добавлен вход и переключение ролей.

## Запуск

### Локальный режим с SQLite (рекомендуется, дефолт)

```bash
npm install
npm run dev
```

При первом запуске:
1. Создаётся каталог `data/`.
2. Создаётся файл `data/watchlab.db`.
3. Применяется схема (таблицы, индексы, триггеры).
4. Заполняются демо-данные.

`.env.local` для этого режима не обязателен. Если хотите явно:

```env
APP_DATA_SOURCE=sqlite
APP_SQLITE_PATH=data/watchlab.db
APP_SESSION_SECRET=dev-secret
ENABLE_DEMO_AUTH=true
```

### Режим mock (RAM)

```env
APP_DATA_SOURCE=mock
APP_SESSION_SECRET=dev-secret
ENABLE_DEMO_AUTH=true
```

### Режим Supabase

1. Создать проект в Supabase.
2. Выполнить SQL из `supabase/schema.sql`.
3. Выполнить SQL из `supabase/seed.sql`.
4. Создать `.env.local` на основе `.env.example`.
5. Указать:

```env
APP_DATA_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_SESSION_SECRET=long-random-secret
ENABLE_DEMO_AUTH=false
```

6. `npm run dev`.

## Демо-доступы (любой режим)

- admin: `admin@watchlab.local` / `admin123`
- master: `romanov.master@example.com` / `master123`
- client: `ivan.petrov@example.com` / `client123`
- SMS-код в dev-режиме: `1234`

## Прод-заметки

- Перед деплоем обязательно заменить `APP_SESSION_SECRET`.
- В режиме SQLite `data/` нужно положить на персистентный том (volume), иначе БД будет пересоздаваться. Файл `data/` по умолчанию в `.gitignore`.
- В serverless/edge-средах SQLite не работает (нужна файловая система с persistent storage) — в таких случаях используйте Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` нельзя отдавать в браузер.
- `ENABLE_DEMO_AUTH=false` отключает быстрый вход по ролям.
- Уведомления реализованы как серверные точки расширения в `src/server/notifications.ts`; туда можно подключить SMS, email или Telegram.
- Проверка свободных слотов есть на backend-уровне; и в SQLite, и в Supabase создан уникальный частичный индекс на активные записи мастера в один слот.
