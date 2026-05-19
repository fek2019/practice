# Настройка проекта

## 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. В **SQL Editor** выполните `supabase/schema.sql` (создаёт таблицы + RLS)
3. В **SQL Editor** выполните `supabase/seed.sql` (тестовые данные)
4. Скопируйте из **Project Settings → API**:
   - `Project URL` → `SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Resend (email OTP)

1. Зарегистрируйтесь на [resend.com](https://resend.com)
2. Создайте API Key → `RESEND_API_KEY`
3. Добавьте и подтвердите свой домен (или используйте `onboarding@resend.dev`
   для первого теста)
4. Укажите `EMAIL_FROM` — например `WatchLab <noreply@yourdomain.com>`

> **Без Resend** (только `.env` без `RESEND_API_KEY`) коды печатаются
> в консоль сервера — удобно для локальной разработки.

## 3. .env.local

```
APP_DATA_SOURCE=supabase

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

RESEND_API_KEY=re_xxxx
EMAIL_FROM=WatchLab <noreply@yourdomain.com>

APP_SESSION_SECRET=<openssl rand -base64 48>
ENABLE_DEMO_AUTH=true
```

## 4. Запуск

```bash
npm install
npm run dev
```

## Как работает авторизация

| Шаг | Email | Телефон |
|-----|-------|---------|
| 1 | Нажать «Получить код» | Нажать «Получить код» |
| 2 | Код отправляется на почту через Resend | Код логируется в консоль (SMS-stub) |
| 3 | Ввести email + пароль + код → «Войти» | Ввести телефон + код → «Войти» |
| 4 | Редирект в кабинет по роли | Редирект в кабинет по роли |

Коды хранятся в таблице `auth_codes` в Supabase (TTL 10 минут).  
Повторный запрос кода доступен через 60 секунд (кнопка блокируется).

## SMS (продакшен)

Откройте `src/server/notifications.ts` и замените `sendSmsCode` на вызов
Twilio, SMS.ru или другого провайдера. Добавьте соответствующие ключи в `.env`.
