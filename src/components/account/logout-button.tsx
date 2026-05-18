"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/account");
  };

  return (
    <button type="button" className="outline-button cabinet-logout-button" onClick={handleLogout}>
      Выйти
    </button>
  );
}
