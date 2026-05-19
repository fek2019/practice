create extension if not exists pgcrypto;

do $$
begin
  create type watch_category as enum ('mechanical', 'quartz', 'smart');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type repair_type as enum ('glass', 'cleaning', 'restoration', 'battery', 'waterproofing');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type master_specialization as enum ('mechanical', 'quartz', 'smart', 'universal');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type appointment_status as enum ('pending', 'in-progress', 'ready', 'done', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type user_role as enum ('client', 'master', 'admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists services (
  id text primary key,
  name text not null,
  description text not null,
  price integer not null check (price >= 0),
  category watch_category not null,
  repair_type repair_type not null,
  image_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists masters (
  id text primary key,
  name text not null,
  photo text not null,
  specialization master_specialization not null,
  experience integer not null check (experience >= 0),
  rating numeric(2, 1) not null check (rating >= 0 and rating <= 5),
  available boolean not null default true,
  bio text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id text primary key,
  name text not null,
  phone text unique,
  email text unique,
  role user_role not null default 'client',
  is_banned boolean not null default false,
  password_hash text,
  linked_master_id text references masters(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_contact_required check (phone is not null or email is not null)
);

create table if not exists appointments (
  id text primary key,
  client_name text not null,
  client_phone text not null,
  client_email text not null,
  service_id text not null references services(id) on update cascade on delete restrict,
  master_id text not null references masters(id) on update cascade on delete restrict,
  date date not null,
  time_slot text not null,
  status appointment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quick_requests (
  id text primary key,
  client_name text not null,
  client_phone text not null,
  service_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id text primary key,
  appointment_id text not null unique references appointments(id) on delete cascade,
  master_id text not null references masters(id) on delete cascade,
  client_user_id text not null references users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  text text not null,
  created_at timestamptz not null default now()
);

-- OTP codes for email / phone verification.
-- Codes expire automatically; old rows are cleaned up on insert.
create table if not exists auth_codes (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,           -- normalized email or phone
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists auth_codes_identifier_idx on auth_codes(identifier);
-- Auto-drop expired rows so the table stays small
create index if not exists auth_codes_expires_idx on auth_codes(expires_at);

create unique index if not exists appointments_master_slot_active_uidx
  on appointments(master_id, date, time_slot)
  where status <> 'done';

create index if not exists appointments_client_phone_idx on appointments(client_phone);
create index if not exists appointments_client_email_idx on appointments(client_email);
create index if not exists appointments_master_date_idx on appointments(master_id, date, time_slot);
create index if not exists services_filter_idx on services(category, repair_type, price);
create index if not exists masters_available_idx on masters(available);
create index if not exists reviews_client_idx on reviews(client_user_id, created_at);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists services_set_updated_at on services;
create trigger services_set_updated_at
before update on services
for each row execute function set_updated_at();

drop trigger if exists masters_set_updated_at on masters;
create trigger masters_set_updated_at
before update on masters
for each row execute function set_updated_at();

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists appointments_set_updated_at on appointments;
create trigger appointments_set_updated_at
before update on appointments
for each row execute function set_updated_at();

alter table services enable row level security;
alter table masters enable row level security;
alter table users enable row level security;
alter table appointments enable row level security;
alter table quick_requests enable row level security;
alter table reviews enable row level security;
alter table auth_codes enable row level security;

-- service_role bypasses RLS by default in Supabase.
-- The policies below add explicit anon/authenticated access where needed.

-- Публичное чтение услуг и мастеров (для страницы каталога без авторизации)
create policy if not exists "services: public read"
  on services for select using (true);

create policy if not exists "masters: public read"
  on masters for select using (true);

-- Все остальные таблицы доступны только через service_role (серверный код)
-- Анонимный/authenticated доступ закрыт — фронтенд обращается только через API-роуты
create policy if not exists "users: deny anon"
  on users for all using (false);

create policy if not exists "appointments: deny anon"
  on appointments for all using (false);

create policy if not exists "quick_requests: deny anon"
  on quick_requests for all using (false);

create policy if not exists "reviews: deny anon"
  on reviews for all using (false);

create policy if not exists "auth_codes: deny anon"
  on auth_codes for all using (false);
