import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { RevealController } from "@/components/ui/reveal-controller";
import "./globals.css";

const headingFont = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-heading",
  weight: ["500", "700"]
});

const bodyFont = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Watch Lab | Ремонт часов",
  description: "Онлайн-сервис для записи в мастерскую по ремонту часов"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <RevealController />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
