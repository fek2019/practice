insert into services (id, name, description, price, category, repair_type, image_url)
values
  ('srv-1', 'Замена стекла', 'Подбор и установка минерального или сапфирового стекла с герметизацией корпуса.', 3500, 'mechanical', 'glass', 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1000&q=80'),
  ('srv-2', 'Чистка механизма', 'Полная разборка, ультразвуковая чистка и смазка основных узлов калибра.', 6200, 'mechanical', 'cleaning', 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1000&q=80'),
  ('srv-3', 'Реставрация корпуса', 'Удаление царапин, полировка и восстановление геометрии корпуса.', 7800, 'quartz', 'restoration', 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1000&q=80'),
  ('srv-4', 'Замена батарейки', 'Быстрая диагностика кварцевого модуля и установка новой батарейки.', 1200, 'quartz', 'battery', 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=1000&q=80'),
  ('srv-5', 'Восстановление водозащиты', 'Замена прокладок, тест на герметичность и протокол проверки.', 2800, 'quartz', 'waterproofing', 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80'),
  ('srv-6', 'Диагностика smart-часов', 'Проверка электроники, шлейфов, датчиков и состояния аккумулятора.', 2400, 'smart', 'cleaning', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=1000&q=80'),
  ('srv-7', 'Замена дисплея smart-часов', 'Снятие старого модуля, установка нового дисплея, проверка сенсора.', 8900, 'smart', 'glass', 'https://images.unsplash.com/photo-1544117519-31a4b719223d?auto=format&fit=crop&w=1000&q=80'),
  ('srv-8', 'Премиум сервис механики', 'Комплексный сервис люксовых механических часов с расширенной гарантией.', 14900, 'mechanical', 'cleaning', 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1000&q=80')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  repair_type = excluded.repair_type,
  image_url = excluded.image_url;

insert into masters (id, name, photo, specialization, experience, rating, available, bio)
values
  ('m-1', 'Александр Романов', 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=800&q=80', 'mechanical', 14, 4.9, true, 'Сертифицированный мастер по механике. Работает с швейцарскими и японскими калибрами.'),
  ('m-2', 'Мария Гончарова', 'https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?auto=format&fit=crop&w=800&q=80', 'quartz', 9, 4.8, true, 'Специалист по кварцевым механизмам и восстановлению герметичности.'),
  ('m-3', 'Игорь Ветров', 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80', 'smart', 7, 4.7, true, 'Ремонт и пайка плат smart-часов, замена дисплеев и аккумуляторов.'),
  ('m-4', 'Дмитрий Кондратьев', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80', 'universal', 18, 5.0, true, 'Ведущий мастер сети. Ведет сложные и срочные заказы, включая реставрацию корпуса.')
on conflict (id) do update set
  name = excluded.name,
  photo = excluded.photo,
  specialization = excluded.specialization,
  experience = excluded.experience,
  rating = excluded.rating,
  available = excluded.available,
  bio = excluded.bio;

insert into users (id, name, phone, email, role, password_hash, linked_master_id)
values
  ('u-1', 'Иван Петров', '+7 999 123 45 67', 'ivan.petrov@example.com', 'client', 'scrypt$-JAjrRaairJIy_fnncWxyw$3xAYWkWi_4bdUH8NCy0IHVJVNZVEC9sP9priOYqvbJ6pa7I3fBdLLEPh_Q2ljA9EStSnRTsww9_LLE-CexW7Bw', null),
  ('u-2', 'Александр Романов', '+7 900 111 22 33', 'romanov.master@example.com', 'master', 'scrypt$Emv7jkiF1qP_gOwDaBD8ww$p4IpLaSm7cq1YK7kGUJ0EXJumlgx1IyvqMS7xqaEGLRDOT2zMoY8geCgifEw9GkCtJW5pZQSEYnJ-S_-nYEW-A', 'm-1'),
  ('u-3', 'Администратор', '+7 900 000 00 01', 'admin@watchlab.local', 'admin', 'scrypt$iEHWaMxjP0nkuZo9QfWd3Q$dyXIjaQKirBIC9jgDmWV_8pgInCilHkxLf4YI_h0bsmxBcNH6EHVR9uyiNTuGQdxTHzaKGiU1llYbXJn_qJa6w', null)
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  role = excluded.role,
  password_hash = excluded.password_hash,
  linked_master_id = excluded.linked_master_id;

-- Demo appointments are intentionally not seeded.
-- Orders must be created only through the booking flow and stored in the DB.
delete from appointments
where id in ('a-1001', 'a-1002', 'a-1003', 'a-1004');
