import { Appointment, Master, QuickRequest, Service, User } from "@/types";

export const mockDb: {
  services: Service[];
  masters: Master[];
  appointments: Appointment[];
  users: User[];
  quickRequests: QuickRequest[];
} = {
  services: [
    {
      id: "srv-1",
      name: "Замена стекла",
      description: "Подбор и установка минерального или сапфирового стекла с герметизацией корпуса.",
      price: 3500,
      category: "mechanical",
      repairType: "glass",
      imageUrl:
        "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: "srv-2",
      name: "Чистка механизма",
      description: "Полная разборка, ультразвуковая чистка и смазка основных узлов калибра.",
      price: 6200,
      category: "mechanical",
      repairType: "cleaning",
      imageUrl:
        "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: "srv-3",
      name: "Реставрация корпуса",
      description: "Удаление царапин, полировка и восстановление геометрии корпуса.",
      price: 7800,
      category: "quartz",
      repairType: "restoration",
      imageUrl:
        "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: "srv-4",
      name: "Замена батарейки",
      description: "Быстрая диагностика кварцевого модуля и установка новой батарейки.",
      price: 1200,
      category: "quartz",
      repairType: "battery",
      imageUrl:
        "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: "srv-5",
      name: "Восстановление водозащиты",
      description: "Замена прокладок, тест на герметичность и протокол проверки.",
      price: 2800,
      category: "quartz",
      repairType: "waterproofing",
      imageUrl:
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: "srv-6",
      name: "Диагностика smart-часов",
      description: "Проверка электроники, шлейфов, датчиков и состояния аккумулятора.",
      price: 2400,
      category: "smart",
      repairType: "cleaning",
      imageUrl:
        "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: "srv-7",
      name: "Замена дисплея smart-часов",
      description: "Снятие старого модуля, установка нового дисплея, проверка сенсора.",
      price: 8900,
      category: "smart",
      repairType: "glass",
      imageUrl:
        "https://images.unsplash.com/photo-1544117519-31a4b719223d?auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: "srv-8",
      name: "Премиум сервис механики",
      description: "Комплексный сервис люксовых механических часов с расширенной гарантией.",
      price: 14900,
      category: "mechanical",
      repairType: "cleaning",
      imageUrl:
        "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1000&q=80"
    }
  ],
  masters: [
    {
      id: "m-1",
      name: "Александр Романов",
      photo:
        "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=800&q=80",
      specialization: "mechanical",
      experience: 14,
      rating: 4.9,
      available: true,
      bio: "Сертифицированный мастер по механике. Работает с швейцарскими и японскими калибрами."
    },
    {
      id: "m-2",
      name: "Мария Гончарова",
      photo:
        "https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?auto=format&fit=crop&w=800&q=80",
      specialization: "quartz",
      experience: 9,
      rating: 4.8,
      available: true,
      bio: "Специалист по кварцевым механизмам и восстановлению герметичности."
    },
    {
      id: "m-3",
      name: "Игорь Ветров",
      photo:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80",
      specialization: "smart",
      experience: 7,
      rating: 4.7,
      available: true,
      bio: "Ремонт и пайка плат smart-часов, замена дисплеев и аккумуляторов."
    },
    {
      id: "m-4",
      name: "Дмитрий Кондратьев",
      photo:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
      specialization: "universal",
      experience: 18,
      rating: 5,
      available: true,
      bio: "Ведущий мастер сети. Ведет сложные и срочные заказы, включая реставрацию корпуса."
    }
  ],
  appointments: [
    {
      id: "a-1001",
      clientName: "Иван Петров",
      clientPhone: "+7 999 123 45 67",
      clientEmail: "ivan.petrov@example.com",
      serviceId: "srv-2",
      masterId: "m-1",
      date: "2026-03-17",
      timeSlot: "11:00",
      status: "in-progress",
      createdAt: "2026-03-10T08:30:00.000Z"
    },
    {
      id: "a-1002",
      clientName: "Елена Смирнова",
      clientPhone: "+7 905 456 19 81",
      clientEmail: "elena@example.com",
      serviceId: "srv-4",
      masterId: "m-2",
      date: "2026-03-16",
      timeSlot: "14:00",
      status: "ready",
      createdAt: "2026-03-09T12:00:00.000Z"
    },
    {
      id: "a-1003",
      clientName: "Артем Федоров",
      clientPhone: "+7 921 444 66 77",
      clientEmail: "af@example.com",
      serviceId: "srv-7",
      masterId: "m-3",
      date: "2026-03-18",
      timeSlot: "15:00",
      status: "pending",
      createdAt: "2026-03-12T15:42:00.000Z"
    },
    {
      id: "a-1004",
      clientName: "Иван Петров",
      clientPhone: "+7 999 123 45 67",
      clientEmail: "ivan.petrov@example.com",
      serviceId: "srv-1",
      masterId: "m-4",
      date: "2026-02-25",
      timeSlot: "12:00",
      status: "done",
      createdAt: "2026-02-20T11:10:00.000Z"
    }
  ],
  users: [
    {
      id: "u-1",
      name: "Иван Петров",
      phone: "+7 999 123 45 67",
      email: "ivan.petrov@example.com",
      role: "client",
      appointments: ["a-1001", "a-1004"]
    },
    {
      id: "u-2",
      name: "Александр Романов",
      phone: "+7 900 111 22 33",
      email: "romanov.master@example.com",
      role: "master",
      appointments: ["a-1001"],
      linkedMasterId: "m-1"
    },
    {
      id: "u-3",
      name: "Администратор",
      phone: "+7 900 000 00 01",
      email: "admin@watchlab.local",
      role: "admin",
      password: "admin123",
      appointments: []
    }
  ],
  quickRequests: []
};

