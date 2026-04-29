# Backend: что добавлено и сделано

## Кратко

Проект переведен с прямого использования frontend-заглушек на нормальный backend-слой через Next.js API routes. Фронтенд теперь обращается к `/api/*`, а сервер сам выбирает источник данных: локальный mock или Supabase.

## Что добавлено

- Серверный репозиторий данных:
  - `src/server/repositories/mock-repository.ts` - локальный режим без внешней БД.
  - `src/server/repositories/supabase-repository.ts` - режим Supabase через service role key.
  - `src/server/repositories/index.ts` - переключатель источника данных по `APP_DATA_SOURCE`.
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
  - пароли для Supabase seed хранятся как `scrypt` hash;
  - админские CRUD routes требуют роль `admin`;
  - мастер может менять только свои заявки;
  - service role key используется только на сервере.
- Supabase подготовка:
  - `supabase/schema.sql` - таблицы, enum-типы, индексы, RLS, triggers `updated_at`;
  - `supabase/seed.sql` - стартовые услуги, мастера, пользователи и заявки;
  - `.env.example` - переменные окружения для mock/Supabase режима.
- Frontend-подключение:
  - `src/lib/api-client.ts` - клиент для backend API;
  - `src/lib/auth-client.ts` - хранение сессии и auth-запросы;
  - формы записи, быстрые заявки, каталог, мастера и кабинеты переведены на API;
  - страница `/account` больше не заглушка: добавлен вход и переключение ролей.

## Как включить Supabase

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

6. Запустить проект:

```bash
npm run dev
```

## Локальный режим

Без Supabase проект работает через mock-репозиторий:

```env
APP_DATA_SOURCE=mock
APP_SESSION_SECRET=dev-secret
ENABLE_DEMO_AUTH=true
```

Демо-доступ:

- admin: `admin@watchlab.local` / `admin123`
- master: `romanov.master@example.com` / `master123`
- client: `ivan.petrov@example.com` / `client123`
- SMS-код в dev-режиме: `1234`

## Прод-заметки

- Перед деплоем обязательно заменить `APP_SESSION_SECRET`.
- `SUPABASE_SERVICE_ROLE_KEY` нельзя отдавать в браузер.
- `ENABLE_DEMO_AUTH=false` отключает быстрый вход по ролям.
- Сейчас уведомления реализованы как серверные точки расширения в `src/server/notifications.ts`; туда можно подключить SMS, email или Telegram.
- Проверка свободных слотов есть на backend-уровне; в Supabase дополнительно создан уникальный индекс на активные записи мастера в один слот.
