"use client";

import type { MouseEvent } from "react";

export function FooterAccountLink() {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.dispatchEvent(new Event("watchlab:open-account"));
  };

  return (
    <a href="/account" onClick={handleClick}>
      Кабинет
    </a>
  );
}
