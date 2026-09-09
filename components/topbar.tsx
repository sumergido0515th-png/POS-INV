"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { ROLE_LABELS } from "@/lib/rbac";
import { useState } from "react";
import { MobileNav } from "@/components/mobile-nav";

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  pos: "Point of Sale",
  inventory: "Inventory",
  sales: "Sales History",
  reports: "Reports",
  users: "User Management",
  settings: "Settings",
};

export function Topbar({ name, role }: { name: string; role: "ADMIN" | "CASHIER" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const segment = pathname.split("/")[1];
  const title = TITLES[segment] ?? "JP Laagan MotoPOS";

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-100 bg-white/80 backdrop-blur px-4 md:px-6 py-3">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden btn-ghost p-2"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-ink-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-ink-900 leading-tight">{name}</p>
          <p className="text-xs text-ink-500 leading-tight">{ROLE_LABELS[role]}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-ghost p-2"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} role={role} />
    </header>
  );
}
