"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Главная" },
  { href: "/services", label: "Услуги" },
  { href: "/masters", label: "Мастера" },
  { href: "/booking", label: "Запись онлайн" },
  { href: "/account", label: "Кабинет" },
  { href: "/contacts", label: "Контакты" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">W</span>
          <span className="brand-text">
            <strong>Watch Lab</strong>
            <small>Сеть часовых мастерских</small>
          </span>
        </Link>

        <button className={cn("burger-button", open && "is-open")} onClick={() => setOpen((value) => !value)} aria-label="Открыть меню">
          <span />
          <span />
          <span />
        </button>

        <nav className={cn("nav site-nav", open && "nav-open")}>
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-link", active && "nav-link-active")}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
          <Link className="header-cta" href="/booking" onClick={() => setOpen(false)}>
            Записаться
          </Link>
        </nav>
      </div>
    </header>
  );
}
